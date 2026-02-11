# Novel-Studio-Web LLM 集成架构设计文档

## 1. 架构概述

### 1.1 设计目标
- 统一抽象层，支持多种 LLM API
- 可扩展的 Provider 架构，易于添加新的模型
- 统一的流式输出接口
- 错误处理和重试机制
- 成本控制和监控
- 可选：对接 Vercel AI SDK 或自建 Provider 适配层

### 1.2 支持的 LLM Provider

| Provider | 模型示例 | 流式支持 | 函数调用 |
|----------|---------|---------|---------|
| OpenAI | GPT-4, GPT-3.5 | ✓ | ✓ |
| Anthropic | Claude 3 Opus, Sonnet | ✓ | ✓ |
| DeepSeek | DeepSeek Chat | ✓ | ✗ |
| 通义千问 | qwen-turbo, qwen-plus | ✓ | ✓ |
| 智谱 AI | GLM-4 | ✓ | ✓ |
| 百度文心 | ERNIE-Bot | ✓ | ✗ |
| 本地 Ollama | llama3, mistral | ✓ | ✗ |
| 自定义 API | 兼容 OpenAI 格式 | ✓ | ✓ |

### 1.3 运行时组件与数据流（任务化 + SSE）

面向“AI IDE 逐行编写 + 多智能体协同 + 大量数据传递”，推荐把 AI 生成/分析等长耗时工作 **任务化**，并用 **SSE（Server-Sent Events）** 做流式输出通道：

```
┌──────────────┐      POST /ai/tasks       ┌──────────────┐     enqueue     ┌──────────────┐
│  Web App      │ ───────────────────────▶ │  API Server   │ ──────────────▶ │   Worker      │
│ (Next.js UI)  │ ◀─────────────────────── │ (Fastify)     │  subscribe      │ (LLM runtime) │
└──────┬───────┘   GET /ai/tasks/:id/stream └──────┬───────┘  (Redis)        └──────┬───────┘
       │                                           │                                 │
       │                                           │ publish chunks/status            │
       │                                           ▼                                 ▼
       │                                   ┌──────────────┐                  ┌──────────────┐
       │                                   │    Redis      │                  │  PostgreSQL   │
       │                                   │ (queue+pubsub)│                  │ (tasks+result)│
       │                                   └──────────────┘                  └──────────────┘
```

关键点：
- 任务创建接口快速返回 `taskId`，避免单个请求长时间占用连接。
- Worker 负责真正调用 LLM，并把增量输出（chunk/token）推到 Redis（Pub/Sub 或 Streams）。
- API Server 通过 SSE 把增量输出转发给前端；最终结果写入 PostgreSQL（或对象存储），前端再按需拉取。

### 1.4 SSE 事件协议（建议）


SSE 采用 `text/event-stream`，每条消息用 `event:` + `data:`，`data` 统一为 JSON。

事件类型建议（最小集合）：
- `task.started`：任务进入执行态
- `task.delta`：流式增量输出（文本片段/结构化 patch）
- `task.usage`：token/费用统计（可选，完成时发送）
- `task.completed`：任务完成，提供最终结果引用（resultId/resultUrl）
- `task.failed`：任务失败，提供错误码与可展示信息

`task.delta` 的 `data` 建议字段：
- `taskId`: string
- `seq`: number（递增序号，便于重放/断线续传）
- `kind`: "text" | "json" | "patch"
- `delta`: string | object

断线续传建议：
- 服务端为每个任务维护一个短期 event buffer（Redis Streams 或内存 + TTL）。
- 客户端断线重连时携带 `Last-Event-ID`（或 query 中 `cursor`），服务端从 buffer 回放缺失事件。

---


## 2. 核心架构

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                   应用层 (Application)                  │
│  AI 续写 | AI 改写 | AI 聊天 | AI 分析                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Vercel AI SDK (统一抽象层)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │         generateText() | streamText()               │   │
│  │         - OpenAI Provider                           │   │
│  │         - Anthropic Provider                        │   │
│  │         - Custom Provider                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   服务层 (Service)                      │
│  AI 服务 | 智能体服务 | 上下文管理 | 提示词构建         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│             Provider 实现层 (Providers)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ OpenAI   │ │Anthropic │ │DeepSeek  │ │Ollama    │  │
│  │ Provider │ │ Provider │ │ Provider │ │ Provider │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              外部 LLM API (External APIs)                │
│  OpenAI API | Anthropic API | DeepSeek API | ...       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 类型定义

```typescript
// ==================== 核心接口 ====================

/**
 * LLM 请求配置
 */
interface LLMRequestConfig {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

/**
 * LLM 响应
 */
interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

/**
 * 消息类型
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 流式响应
 */
interface LLMStreamChunk {
  content: string;
  isComplete: boolean;
  finishReason?: string;
}

/**
 * LLM Provider 接口
 */
interface ILLMProvider {
  name: string;
  baseUrl?: string;

  /**
   * 生成非流式响应
   */
  generate(config: LLMRequestConfig): Promise<LLMResponse>;

  /**
   * 生成流式响应
   */
  generateStream(
    config: LLMRequestConfig,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete: (response: LLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void>;

  /**
   * 计算 tokens 数量
   */
  countTokens(text: string): number;

  /**
   * 获取模型信息
   */
  getModelInfo(modelId: string): LLMModelInfo;
}

/**
 * 模型信息
 */
interface LLMModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens?: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  pricing?: {
    input: number;  // per 1K tokens
    output: number;
  };
}
```

---

## 3. Provider 实现

### 3.1 OpenAI Provider

```typescript
import OpenAI from 'openai';

class OpenAIProvider implements ILLMProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async generate(config: LLMRequestConfig): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: config.messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
      stop: config.stop,
      stream: false,
    });

    return {
      content: response.choices[0].message.content || '',
      finishReason: response.choices[0].finish_reason as any,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
    };
  }

  async generateStream(
    config: LLMRequestConfig,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete: (response: LLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: config.model,
        messages: config.messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      });

      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk({
            content: delta.content,
            isComplete: false,
          });
        }

        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens;
          completionTokens = chunk.usage.completion_tokens;
        }

        const finishReason = chunk.choices[0]?.finish_reason;
        if (finishReason) {
          onComplete({
            content: fullContent,
            finishReason: finishReason as any,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
            model: config.model,
          });
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  countTokens(text: string): number {
    // 使用 tiktoken 或简化估算
    return Math.ceil(text.length / 4);
  }

  getModelInfo(modelId: string): LLMModelInfo {
    const models: Record<string, LLMModelInfo> = {
      'gpt-4-turbo': {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        pricing: { input: 0.01, output: 0.03 },
      },
      'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        contextWindow: 16385,
        maxOutputTokens: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        pricing: { input: 0.0005, output: 0.0015 },
      },
    };

    return models[modelId] || {
      id: modelId,
      name: modelId,
      provider: 'openai',
      contextWindow: 4096,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    };
  }
}
```

### 3.2 Anthropic Claude Provider

```typescript
import Anthropic from '@anthropic-ai/sdk';

class AnthropicProvider implements ILLMProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(config: LLMRequestConfig): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: config.model,
      messages: this.convertMessages(config.messages),
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature,
      stop_sequences: config.stop,
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      finishReason: response.stop_reason as any,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  async generateStream(
    config: LLMRequestConfig,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete: (response: LLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const stream = await this.client.messages.stream({
        model: config.model,
        messages: this.convertMessages(config.messages),
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature,
      });

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      stream.on('text', (text) => {
        fullContent += text;
        onChunk({ content: text, isComplete: false });
      });

      stream.on('message', (message) => {
        inputTokens = message.usage.input_tokens;
        outputTokens = message.usage.output_tokens;

        onComplete({
          content: fullContent,
          finishReason: message.stop_reason as any,
          usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
          model: config.model,
        });
      });

      stream.on('error', (error) => {
        onError(error);
      });
    } catch (error) {
      onError(error as Error);
    }
  }

  private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
    // 将 system 消息转换为 system 参数
    const systemContent = messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role !== 'system');

    const result = userMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    if (systemContent) {
      return { system: systemContent, messages: result };
    }

    return result as any;
  }

  countTokens(text: string): number {
    return Math.ceil(text.length * 0.9); // Claude 使用不同的 tokenizer
  }

  getModelInfo(modelId: string): LLMModelInfo {
    const models: Record<string, LLMModelInfo> = {
      'claude-3-opus': {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        pricing: { input: 0.015, output: 0.075 },
      },
      'claude-3-sonnet': {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        pricing: { input: 0.003, output: 0.015 },
      },
    };

    return models[modelId];
  }
}
```

### 3.3 Ollama (本地模型) Provider

```typescript
import Ollama from 'ollama';

class OllamaProvider implements ILLMProvider {
  name = 'ollama';
  private client: Ollama;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.client = new Ollama({ host: baseUrl });
  }

  async generate(config: LLMRequestConfig): Promise<LLMResponse> {
    const response = await this.client.chat({
      model: config.model,
      messages: config.messages,
      temperature: config.temperature,
      num_ctx: config.maxTokens,
    });

    return {
      content: response.message.content,
      finishReason: response.done ? 'stop' : 'length',
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      model: config.model,
    };
  }

  async generateStream(
    config: LLMRequestConfig,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete: (response: LLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const stream = await this.client.chat({
        model: config.model,
        messages: config.messages,
        stream: true,
      });

      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const part of stream) {
        if (part.message?.content) {
          fullContent += part.message.content;
          onChunk({ content: part.message.content, isComplete: false });
        }

        promptTokens = part.prompt_eval_count || 0;
        completionTokens = part.eval_count || 0;

        if (part.done) {
          onComplete({
            content: fullContent,
            finishReason: 'stop',
            usage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
            model: config.model,
          });
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  getModelInfo(modelId: string): LLMModelInfo {
    return {
      id: modelId,
      name: modelId,
      provider: 'ollama',
      contextWindow: 4096,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    };
  }
}
```

---

## 4. LLM 管理器

### 4.1 统一管理接口

```typescript
class LLMManager {
  private providers: Map<string, ILLMProvider> = new Map();
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.initializeProviders();
  }

  /**
   * 初始化所有配置的 Providers
   */
  private initializeProviders() {
    // OpenAI
    if (this.config.openai?.apiKey) {
      this.providers.set('openai', new OpenAIProvider(
        this.config.openai.apiKey,
        this.config.openai.baseURL
      ));
    }

    // Anthropic
    if (this.config.anthropic?.apiKey) {
      this.providers.set('anthropic', new AnthropicProvider(
        this.config.anthropic.apiKey
      ));
    }

    // Ollama
    if (this.config.ollama?.enabled) {
      this.providers.set('ollama', new OllamaProvider(
        this.config.ollama.baseUrl
      ));
    }

    // 更多 Providers...
  }

  /**
   * 获取 Provider
   */
  getProvider(providerName: string): ILLMProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    return provider;
  }

  /**
   * 获取模型信息
   */
  getModelInfo(modelId: string): LLMModelInfo {
    // 解析模型 ID：provider:model
    const [providerName, model] = modelId.split(':');
    const provider = this.getProvider(providerName);
    return provider.getModelInfo(model);
  }

  /**
   * 生成非流式响应
   */
  async generate(
    modelId: string,
    config: Omit<LLMRequestConfig, 'model'>
  ): Promise<LLMResponse> {
    const [providerName, model] = modelId.split(':');
    const provider = this.getProvider(providerName);

    return provider.generate({
      ...config,
      model,
    });
  }

  /**
   * 生成流式响应
   */
  async generateStream(
    modelId: string,
    config: Omit<LLMRequestConfig, 'model' | 'stream'>,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete: (response: LLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const [providerName, model] = modelId.split(':');
    const provider = this.getProvider(providerName);

    return provider.generateStream(
      { ...config, model, stream: true },
      onChunk,
      onComplete,
      onError
    );
  }

  /**
   * 计算成本
   */
  calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const info = this.getModelInfo(modelId);
    if (!info.pricing) return 0;

    const inputCost = (inputTokens / 1000) * info.pricing.input;
    const outputCost = (outputTokens / 1000) * info.pricing.output;

    return inputCost + outputCost;
  }
}
```

---

## 5. 重试与错误处理

### 5.1 重试策略

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  exponentialBase: number;
  retryableErrors: string[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,      // 1 秒
  maxDelay: 30000,          // 30 秒
  exponentialBase: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'rate_limit_exceeded',
    'insufficient_quota',
  ],
};

class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = defaultRetryConfig
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 检查是否可重试
        if (!this.isRetryable(error, config)) {
          throw error;
        }

        // 最后一次尝试失败
        if (attempt === config.maxRetries) {
          throw error;
        }

        // 计算延迟
        const delay = Math.min(
          config.initialDelay * Math.pow(config.exponentialBase, attempt),
          config.maxDelay
        );

        // 指数退避
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static isRetryable(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    return config.retryableErrors.some(err =>
      errorMessage.includes(err.toLowerCase())
    );
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.2 断路器模式

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime?: Date;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold: number = 5, timeout: number = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() > this.timeout;
  }
}
```

---

## 6. 配置管理

### 6.1 配置文件格式

```yaml
# config/llm.yaml

llm:
  # 默认模型
  defaultModel: openai:gpt-4-turbo

  # 备用模型（降级策略）
  fallbackModels:
    - anthropic:claude-3-sonnet
    - openai:gpt-3.5-turbo

  # 限流配置
  rateLimit:
    requestsPerMinute: 20
    tokensPerMinute: 100000

  # 成本控制
  costControl:
    dailyLimit: 10.0  # 每日成本上限（美元）
    alertThreshold: 0.8  # 警告阈值

# Provider 配置
providers:
  openai:
    apiKey: ${OPENAI_API_KEY}
    baseURL: https://api.openai.com/v1
    models:
      - gpt-4-turbo
      - gpt-3.5-turbo

  anthropic:
    apiKey: ${ANTHROPIC_API_KEY}
    models:
      - claude-3-opus
      - claude-3-sonnet
      - claude-3-haiku

  deepseek:
    apiKey: ${DEEPSEEK_API_KEY}
    baseURL: https://api.deepseek.com
    models:
      - deepseek-chat

  ollama:
    enabled: true
    baseUrl: http://localhost:11434
    models:
      - llama3
      - mistral
```

### 6.2 配置加载

```typescript
import YAML from 'yaml';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

interface LLMConfig {
  defaultModel: string;
  fallbackModels: string[];
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  costControl: {
    dailyLimit: number;
    alertThreshold: number;
  };
  providers: {
    openai?: { apiKey: string; baseURL?: string; models: string[] };
    anthropic?: { apiKey: string; models: string[] };
    deepseek?: { apiKey: string; baseURL?: string; models: string[] };
    ollama?: { enabled: boolean; baseUrl: string; models: string[] };
  };
}

function loadLLMConfig(path: string): LLMConfig {
  const file = fs.readFileSync(path, 'utf-8');
  const config = YAML.parse(file) as LLMConfig;

  // 环境变量替换
  const replaceEnv = (value: string): string => {
    return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
      return process.env[key] || '';
    });
  };

  // 替换 API Key
  if (config.providers.openai?.apiKey) {
    config.providers.openai.apiKey = replaceEnv(config.providers.openai.apiKey);
  }
  if (config.providers.anthropic?.apiKey) {
    config.providers.anthropic.apiKey = replaceEnv(config.providers.anthropic.apiKey);
  }
  // ... 其他 providers

  return config;
}
```

---

## 7. 监控与统计

### 7.1 使用统计

```typescript
class LLMStatsCollector {
  private stats: Map<string, ModelStats> = new Map();

  recordRequest(modelId: string, inputTokens: number, outputTokens: number) {
    const existing = this.stats.get(modelId) || {
      requestCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    };

    existing.requestCount++;
    existing.totalInputTokens += inputTokens;
    existing.totalOutputTokens += outputTokens;
    existing.totalCost += this.calculateCost(modelId, inputTokens, outputTokens);

    this.stats.set(modelId, existing);
  }

  getStats(modelId?: string): ModelStats | Map<string, ModelStats> {
    if (modelId) {
      return this.stats.get(modelId)!;
    }
    return this.stats;
  }

  private calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const llmManager = getLLMManager();
    return llmManager.calculateCost(modelId, inputTokens, outputTokens);
  }
}

interface ModelStats {
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}
```

### 7.2 性能监控

```typescript
class LLMPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  recordRequest(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // 只保留最近 1000 条记录
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  getMetrics(modelId?: string): PerformanceMetric[] {
    if (modelId) {
      return this.metrics.filter(m => m.modelId === modelId);
    }
    return this.metrics;
  }

  getAverageLatency(modelId: string): number {
    const metrics = this.getMetrics(modelId);
    const sum = metrics.reduce((acc, m) => acc + m.latency, 0);
    return sum / metrics.length;
  }

  getSuccessRate(modelId: string): number {
    const metrics = this.getMetrics(modelId);
    const success = metrics.filter(m => m.success).length;
    return success / metrics.length;
  }
}

interface PerformanceMetric {
  modelId: string;
  timestamp: Date;
  latency: number;        // 毫秒
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  error?: string;
}
```

---

**文档版本**: v1.0
**最后更新**: 2026-02-11
