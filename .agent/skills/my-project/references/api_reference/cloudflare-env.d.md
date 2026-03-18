# API Reference: cloudflare-env.d.ts

**Language**: TypeScript

**Source**: `cloudflare-env.d.ts`

---

## Classes

### DOMException

**Inherits from**: Error

#### Methods

##### constructor(message?: string, name?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| message? | string | - | - |
| name? | string | - | - |


##### stack()


##### stack(value: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | any | - | - |




### CompileError

**Inherits from**: Error

#### Methods

##### constructor(message?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| message? | string | - | - |




### RuntimeError

**Inherits from**: Error

#### Methods

##### constructor(message?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| message? | string | - | - |




### Global

**Inherits from**: (none)

#### Methods

##### constructor(descriptor: GlobalDescriptor, value?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| descriptor | GlobalDescriptor | - | - |
| value? | any | - | - |


##### valueOf()




### Instance

**Inherits from**: (none)

#### Methods

##### constructor(module: Module, imports?: Imports)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| module | Module | - | - |
| imports? | Imports | - | - |




### Memory

**Inherits from**: (none)

#### Methods

##### constructor(descriptor: MemoryDescriptor)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| descriptor | MemoryDescriptor | - | - |


##### grow(delta: number)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| delta | number | - | - |




### Module

**Inherits from**: (none)

#### Methods

##### customSections(module: Module, sectionName: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| module | Module | - | - |
| sectionName | string | - | - |


##### exports(module: Module)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| module | Module | - | - |


##### imports(module: Module)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| module | Module | - | - |




### Table

**Inherits from**: (none)

#### Methods

##### constructor(descriptor: TableDescriptor, value?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| descriptor | TableDescriptor | - | - |
| value? | any | - | - |


##### get(index: number)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| index | number | - | - |


##### grow(delta: number, value?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| delta | number | - | - |
| value? | any | - | - |


##### set(index: number, value?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| index | number | - | - |
| value? | any | - | - |




### PromiseRejectionEvent

**Inherits from**: Event



### Navigator

**Inherits from**: (none)

#### Methods

##### sendBeacon(url: string, body?: (ReadableStream | string | (ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| url | string | - | - |
| body? | (ReadableStream | string | (ArrayBuffer | ArrayBufferView | - | - |




### WebSocketRequestResponsePair

**Inherits from**: (none)

#### Methods

##### constructor(request: string, response: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| request | string | - | - |
| response | string | - | - |


##### request()


##### response()




### Event

**Inherits from**: (none)

#### Methods

##### constructor(type: string, init?: EventInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | - | - |
| init? | EventInit | - | - |


##### type()


##### eventPhase()


##### composed()


##### bubbles()


##### preventDefault()


##### cancelable()


##### preventDefault()


##### defaultPrevented()


##### returnValue()


##### currentTarget()


##### dispatched(its target)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| its target | None | - | - |


##### target()


##### srcElement()


##### timeStamp()


##### isTrusted()


##### cancelBubble()


##### cancelBubble(value: boolean)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | boolean | - | - |


##### stopImmediatePropagation()


##### preventDefault()


##### stopPropagation()


##### path(objects on which listeners will be invoked)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| objects on which listeners will be invoked | None | - | - |


##### composedPath()




### AbortController

**Inherits from**: (none)

#### Methods

##### constructor()


##### signal()


##### abort(reason?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| reason? | any | - | - |




### AbortSignal

**Inherits from**: EventTarget

#### Methods

##### abort(reason?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| reason? | any | - | - |


##### timeout(delay: number)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| delay | number | - | - |


##### any(signals: AbortSignal[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| signals | AbortSignal[] | - | - |


##### aborted()


##### reason()


##### onabort()


##### onabort(value: any | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | any | null | - | - |


##### throwIfAborted()




### ExtendableEvent

**Inherits from**: Event

#### Methods

##### waitUntil(promise: Promise<any>)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| promise | Promise<any> | - | - |




### Blob

**Inherits from**: (none)

#### Methods

##### constructor(type?: ((ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type? | ((ArrayBuffer | ArrayBufferView | - | - |


##### size()


##### type()


##### slice(start?: number, end?: number, type?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| start? | number | - | - |
| end? | number | - | - |
| type? | string | - | - |


##### arrayBuffer()


##### bytes()


##### text()


##### stream()




### File

**Inherits from**: Blob

#### Methods

##### constructor(bits: ((ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| bits | ((ArrayBuffer | ArrayBufferView | - | - |


##### name()


##### lastModified()




### CacheStorage

**Inherits from**: (none)

#### Methods

##### open(cacheName: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| cacheName | string | - | - |




### Cache

**Inherits from**: (none)

#### Methods

##### delete(request: RequestInfo | URL, options?: CacheQueryOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| request | RequestInfo | URL | - | - |
| options? | CacheQueryOptions | - | - |


##### match(request: RequestInfo | URL, options?: CacheQueryOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| request | RequestInfo | URL | - | - |
| options? | CacheQueryOptions | - | - |


##### put(request: RequestInfo | URL, response: Response)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| request | RequestInfo | URL | - | - |
| response | Response | - | - |




### Crypto

**Inherits from**: (none)

#### Methods

##### subtle()


##### randomUUID()




### SubtleCrypto

**Inherits from**: (none)

#### Methods

##### encrypt(algorithm: string | SubtleCryptoEncryptAlgorithm, key: CryptoKey, plainText: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoEncryptAlgorithm | - | - |
| key | CryptoKey | - | - |
| plainText | ArrayBuffer | ArrayBufferView | - | - |


##### decrypt(algorithm: string | SubtleCryptoEncryptAlgorithm, key: CryptoKey, cipherText: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoEncryptAlgorithm | - | - |
| key | CryptoKey | - | - |
| cipherText | ArrayBuffer | ArrayBufferView | - | - |


##### sign(algorithm: string | SubtleCryptoSignAlgorithm, key: CryptoKey, data: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoSignAlgorithm | - | - |
| key | CryptoKey | - | - |
| data | ArrayBuffer | ArrayBufferView | - | - |


##### verify(algorithm: string | SubtleCryptoSignAlgorithm, key: CryptoKey, signature: ArrayBuffer | ArrayBufferView, data: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoSignAlgorithm | - | - |
| key | CryptoKey | - | - |
| signature | ArrayBuffer | ArrayBufferView | - | - |
| data | ArrayBuffer | ArrayBufferView | - | - |


##### digest(algorithm: string | SubtleCryptoHashAlgorithm, data: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoHashAlgorithm | - | - |
| data | ArrayBuffer | ArrayBufferView | - | - |


##### generateKey(algorithm: string | SubtleCryptoGenerateKeyAlgorithm, extractable: boolean, keyUsages: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoGenerateKeyAlgorithm | - | - |
| extractable | boolean | - | - |
| keyUsages | string[] | - | - |


##### deriveKey(algorithm: string | SubtleCryptoDeriveKeyAlgorithm, baseKey: CryptoKey, derivedKeyAlgorithm: string | SubtleCryptoImportKeyAlgorithm, extractable: boolean, keyUsages: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoDeriveKeyAlgorithm | - | - |
| baseKey | CryptoKey | - | - |
| derivedKeyAlgorithm | string | SubtleCryptoImportKeyAlgorithm | - | - |
| extractable | boolean | - | - |
| keyUsages | string[] | - | - |


##### deriveBits(algorithm: string | SubtleCryptoDeriveKeyAlgorithm, baseKey: CryptoKey, length?: number | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| algorithm | string | SubtleCryptoDeriveKeyAlgorithm | - | - |
| baseKey | CryptoKey | - | - |
| length? | number | null | - | - |


##### importKey(format: string, keyData: (ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| format | string | - | - |
| keyData | (ArrayBuffer | ArrayBufferView | - | - |


##### exportKey(format: string, key: CryptoKey)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| format | string | - | - |
| key | CryptoKey | - | - |


##### wrapKey(format: string, key: CryptoKey, wrappingKey: CryptoKey, wrapAlgorithm: string | SubtleCryptoEncryptAlgorithm)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| format | string | - | - |
| key | CryptoKey | - | - |
| wrappingKey | CryptoKey | - | - |
| wrapAlgorithm | string | SubtleCryptoEncryptAlgorithm | - | - |


##### unwrapKey(format: string, wrappedKey: ArrayBuffer | ArrayBufferView, unwrappingKey: CryptoKey, unwrapAlgorithm: string | SubtleCryptoEncryptAlgorithm, unwrappedKeyAlgorithm: string | SubtleCryptoImportKeyAlgorithm, extractable: boolean, keyUsages: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| format | string | - | - |
| wrappedKey | ArrayBuffer | ArrayBufferView | - | - |
| unwrappingKey | CryptoKey | - | - |
| unwrapAlgorithm | string | SubtleCryptoEncryptAlgorithm | - | - |
| unwrappedKeyAlgorithm | string | SubtleCryptoImportKeyAlgorithm | - | - |
| extractable | boolean | - | - |
| keyUsages | string[] | - | - |


##### timingSafeEqual(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| a | ArrayBuffer | ArrayBufferView | - | - |
| b | ArrayBuffer | ArrayBufferView | - | - |




### CryptoKey

**Inherits from**: (none)



### TextDecoder

**Inherits from**: (none)

#### Methods

##### constructor(label?: string, options?: TextDecoderConstructorOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| label? | string | - | - |
| options? | TextDecoderConstructorOptions | - | - |


##### stream(or set to false)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| or set to false | None | - | - |


##### stream(or set to false)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| or set to false | None | - | - |


##### TextDecoder(encoding)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| encoding | None | - | - |




### TextEncoder

**Inherits from**: (none)

#### Methods

##### constructor()


##### encode(input?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| input? | string | - | - |


##### encodeInto(input: string, buffer: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| input | string | - | - |
| buffer | ArrayBuffer | ArrayBufferView | - | - |


##### encoding()




### ErrorEvent

**Inherits from**: Event

#### Methods

##### constructor(type: string, init?: ErrorEventErrorEventInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | - | - |
| init? | ErrorEventErrorEventInit | - | - |


##### filename()


##### message()


##### lineno()


##### colno()


##### error()




### MessageEvent

**Inherits from**: Event

#### Methods

##### constructor(type: string, initializer: MessageEventInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | - | - |
| initializer | MessageEventInit | - | - |




### FormData

**Inherits from**: (none)

#### Methods

##### constructor()


##### append(name: string, value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | string | - | - |


##### append(name: string, value: Blob, filename?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | Blob | - | - |
| filename? | string | - | - |


##### delete(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### get(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### getAll(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### has(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### set(name: string, value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | string | - | - |


##### set(name: string, value: Blob, filename?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | Blob | - | - |
| filename? | string | - | - |


##### entries()


##### keys()


##### values()




### HTMLRewriter

**Inherits from**: (none)

#### Methods

##### constructor()


##### on(selector: string, handlers: HTMLRewriterElementContentHandlers)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| selector | string | - | - |
| handlers | HTMLRewriterElementContentHandlers | - | - |


##### onDocument(handlers: HTMLRewriterDocumentContentHandlers)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| handlers | HTMLRewriterDocumentContentHandlers | - | - |


##### transform(response: Response)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| response | Response | - | - |




### FetchEvent

**Inherits from**: ExtendableEvent

#### Methods

##### respondWith(promise: Response | Promise<Response>)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| promise | Response | Promise<Response> | - | - |


##### passThroughOnException()




### Headers

**Inherits from**: (none)

#### Methods

##### constructor(init?: HeadersInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| init? | HeadersInit | - | - |


##### get(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### getAll(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### getSetCookie()


##### has(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### set(name: string, value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | string | - | - |


##### append(name: string, value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | string | - | - |


##### delete(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### entries()


##### keys()


##### values()




### Body

**Inherits from**: (none)

#### Methods

##### body()


##### bodyUsed()


##### arrayBuffer()


##### bytes()


##### text()


##### formData()


##### blob()




### R2Bucket

**Inherits from**: (none)

#### Methods

##### head(key: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| key | string | - | - |




### R2Object

**Inherits from**: (none)

#### Methods

##### writeHttpMetadata(headers: Headers)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| headers | Headers | - | - |




### ScheduledEvent

**Inherits from**: ExtendableEvent

#### Methods

##### noRetry()




### ReadableStreamBYOBReader

**Inherits from**: (none)

#### Methods

##### constructor(stream: ReadableStream)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| stream | ReadableStream | - | - |


##### closed()


##### cancel(reason?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| reason? | any | - | - |


##### releaseLock()




### ReadableStreamBYOBRequest

**Inherits from**: (none)

#### Methods

##### view()


##### respond(bytesWritten: number)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| bytesWritten | number | - | - |


##### respondWithNewView(view: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| view | ArrayBuffer | ArrayBufferView | - | - |


##### atLeast()




### ReadableByteStreamController

**Inherits from**: (none)

#### Methods

##### byobRequest()


##### desiredSize()


##### close()


##### enqueue(chunk: ArrayBuffer | ArrayBufferView)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| chunk | ArrayBuffer | ArrayBufferView | - | - |


##### error(reason: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| reason | any | - | - |




### WritableStreamDefaultController

**Inherits from**: (none)

#### Methods

##### signal()


##### error(reason?: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| reason? | any | - | - |




### FixedLengthStream

**Inherits from**: IdentityTransformStream

#### Methods

##### constructor(expectedLength: number | bigint, queuingStrategy?: IdentityTransformStreamQueuingStrategy)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| expectedLength | number | bigint | - | - |
| queuingStrategy? | IdentityTransformStreamQueuingStrategy | - | - |




### TailEvent

**Inherits from**: ExtendableEvent



### URL

**Inherits from**: (none)

#### Methods

##### constructor(url: string | URL, base?: string | URL)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| url | string | URL | - | - |
| base? | string | URL | - | - |


##### origin()


##### href()


##### href(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### protocol()


##### protocol(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### username()


##### username(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### password()


##### password(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### host()


##### host(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### hostname()


##### hostname(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### port()


##### port(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### pathname()


##### pathname(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### search()


##### search(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### hash()


##### hash(value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | - |


##### searchParams()


##### toJSON()


##### toString()




### URLSearchParams

**Inherits from**: (none)

#### Methods

##### constructor(init?: (Iterable<Iterable<string>> | Record<string, string> | string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| init? | (Iterable<Iterable<string>> | Record<string | - | - |
| string> | string | None | - | - |


##### size()


##### append(name: string, value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | string | - | - |


##### delete(name: string, value?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value? | string | - | - |


##### get(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### getAll(name: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |


##### has(name: string, value?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value? | string | - | - |


##### set(name: string, value: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | - |
| value | string | - | - |


##### sort()


##### entries()


##### keys()


##### values()


##### toString()




### URLPattern

**Inherits from**: (none)

#### Methods

##### constructor(input?: (string | URLPatternInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| input? | (string | URLPatternInit | - | - |


##### protocol()


##### username()


##### password()


##### hostname()


##### port()


##### pathname()


##### search()


##### hash()


##### test(input?: (string | URLPatternInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| input? | (string | URLPatternInit | - | - |


##### exec(input?: (string | URLPatternInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| input? | (string | URLPatternInit | - | - |




### CloseEvent

**Inherits from**: Event

#### Methods

##### constructor(type: string, initializer?: CloseEventInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | - | - |
| initializer? | CloseEventInit | - | - |




### SqlStorageStatement

**Inherits from**: (none)



### EventSource

**Inherits from**: EventTarget

#### Methods

##### constructor(url: string, init?: EventSourceEventSourceInit)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| url | string | - | - |
| init? | EventSourceEventSourceInit | - | - |


##### close()


##### url()


##### withCredentials()


##### readyState()


##### onopen()


##### onopen(value: any | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | any | null | - | - |


##### onmessage()


##### onmessage(value: any | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | any | null | - | - |


##### onerror()


##### onerror(value: any | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| value | any | null | - | - |


##### from(stream: ReadableStream)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| stream | ReadableStream | - | - |




### BaseAiImageClassification

**Inherits from**: (none)



### BaseAiImageToText

**Inherits from**: (none)



### BaseAiImageTextToText

**Inherits from**: (none)



### BaseAiObjectDetection

**Inherits from**: (none)



### BaseAiSentenceSimilarity

**Inherits from**: (none)



### BaseAiAutomaticSpeechRecognition

**Inherits from**: (none)



### BaseAiSummarization

**Inherits from**: (none)



### BaseAiTextClassification

**Inherits from**: (none)



### BaseAiTextEmbeddings

**Inherits from**: (none)



### BaseAiTextGeneration

**Inherits from**: (none)



### BaseAiTextToSpeech

**Inherits from**: (none)



### BaseAiTextToImage

**Inherits from**: (none)



### BaseAiTranslation

**Inherits from**: (none)



### Base_Ai_Cf_Baai_Bge_Base_En_V1_5

**Inherits from**: (none)



### Base_Ai_Cf_Openai_Whisper

**Inherits from**: (none)



### Base_Ai_Cf_Meta_M2M100_1_2B

**Inherits from**: (none)



### Base_Ai_Cf_Baai_Bge_Small_En_V1_5

**Inherits from**: (none)



### Base_Ai_Cf_Baai_Bge_Large_En_V1_5

**Inherits from**: (none)



### Base_Ai_Cf_Unum_Uform_Gen2_Qwen_500M

**Inherits from**: (none)



### Base_Ai_Cf_Openai_Whisper_Tiny_En

**Inherits from**: (none)



### Base_Ai_Cf_Openai_Whisper_Large_V3_Turbo

**Inherits from**: (none)



### Base_Ai_Cf_Baai_Bge_M3

**Inherits from**: (none)



### Base_Ai_Cf_Black_Forest_Labs_Flux_1_Schnell

**Inherits from**: (none)



### Base_Ai_Cf_Meta_Llama_3_2_11B_Vision_Instruct

**Inherits from**: (none)



### Base_Ai_Cf_Meta_Llama_3_3_70B_Instruct_Fp8_Fast

**Inherits from**: (none)



### Base_Ai_Cf_Meta_Llama_Guard_3_8B

**Inherits from**: (none)



### Base_Ai_Cf_Baai_Bge_Reranker_Base

**Inherits from**: (none)



### Base_Ai_Cf_Qwen_Qwen2_5_Coder_32B_Instruct

**Inherits from**: (none)



### Base_Ai_Cf_Qwen_Qwq_32B

**Inherits from**: (none)



### Base_Ai_Cf_Mistralai_Mistral_Small_3_1_24B_Instruct

**Inherits from**: (none)



### Base_Ai_Cf_Google_Gemma_3_12B_It

**Inherits from**: (none)



### Base_Ai_Cf_Meta_Llama_4_Scout_17B_16E_Instruct

**Inherits from**: (none)



### AiGateway

**Inherits from**: (none)

#### Methods

##### patchLog(logId: string, data: AiGatewayPatchLog)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| logId | string | - | - |
| data | AiGatewayPatchLog | - | - |


##### getLog(logId: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| logId | string | - | - |




### AutoRAG

**Inherits from**: (none)

#### Methods

##### list()


##### search(params: AutoRagSearchRequest)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| params | AutoRagSearchRequest | - | - |


##### aiSearch(params: AutoRagAiSearchRequestStreaming)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| params | AutoRagAiSearchRequestStreaming | - | - |


##### aiSearch(params: AutoRagAiSearchRequest)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| params | AutoRagAiSearchRequest | - | - |


##### aiSearch(params: AutoRagAiSearchRequest)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| params | AutoRagAiSearchRequest | - | - |




### D1Database

**Inherits from**: (none)

#### Methods

##### prepare(query: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| query | string | - | - |


##### exec(query: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| query | string | - | - |


##### withSession(constraintOrBookmark?: D1SessionBookmark | D1SessionConstraint)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| constraintOrBookmark? | D1SessionBookmark | D1SessionConstraint | - | - |


##### dump()


##### dump()




### D1DatabaseSession

**Inherits from**: (none)

#### Methods

##### prepare(query: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| query | string | - | - |


##### getBookmark()




### D1PreparedStatement

**Inherits from**: (none)

#### Methods

##### bind(...values: unknown[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ...values | unknown[] | - | - |




### EmailEvent

**Inherits from**: ExtendableEvent



### WorkflowStep

**Inherits from**: (none)



### VectorizeIndex

**Inherits from**: (none)

#### Methods

##### describe()


##### query(vector: VectorFloatArray | number[], options?: VectorizeQueryOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vector | VectorFloatArray | number[] | - | - |
| options? | VectorizeQueryOptions | - | - |


##### insert(vectors: VectorizeVector[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vectors | VectorizeVector[] | - | - |


##### upsert(vectors: VectorizeVector[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vectors | VectorizeVector[] | - | - |


##### processed(and thus deleted)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| and thus deleted | None | - | - |


##### deleteByIds(ids: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ids | string[] | - | - |


##### getByIds(ids: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ids | string[] | - | - |




### Vectorize

**Inherits from**: (none)

#### Methods

##### describe()


##### query(vector: VectorFloatArray | number[], options?: VectorizeQueryOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vector | VectorFloatArray | number[] | - | - |
| options? | VectorizeQueryOptions | - | - |


##### queryById(vectorId: string, options?: VectorizeQueryOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vectorId | string | - | - |
| options? | VectorizeQueryOptions | - | - |


##### insert(vectors: VectorizeVector[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vectors | VectorizeVector[] | - | - |


##### upsert(vectors: VectorizeVector[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| vectors | VectorizeVector[] | - | - |


##### deleteByIds(ids: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ids | string[] | - | - |


##### getByIds(ids: string[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ids | string[] | - | - |




### NonRetryableError

**Inherits from**: Error

#### Methods

##### constructor(message: string, name?: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| message | string | - | - |
| name? | string | - | - |




### WorkflowInstance

**Inherits from**: (none)

#### Methods

##### pause()


##### resume()


##### terminate()


##### restart()


##### status()




## Functions

### instantiate(module: Module, imports?: Imports)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| module | Module | - | - |
| imports? | Imports | - | - |

**Returns**: (none)



### validate(bytes: BufferSource)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| bytes | BufferSource | - | - |

**Returns**: (none)



### dispatchEvent(event: WorkerGlobalScopeEventMap[keyof WorkerGlobalScopeEventMap])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| event | WorkerGlobalScopeEventMap[keyof WorkerGlobalScopeEventMap] | - | - |

**Returns**: (none)



### btoa(data: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| data | string | - | - |

**Returns**: (none)



### atob(data: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| data | string | - | - |

**Returns**: (none)



### setTimeout(callback: (...args: any[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| callback | (...args: any[] | - | - |

**Returns**: (none)



### clearTimeout(timeoutId: number | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| timeoutId | number | null | - | - |

**Returns**: (none)



### setInterval(callback: (...args: any[])

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| callback | (...args: any[] | - | - |

**Returns**: (none)



### clearInterval(timeoutId: number | null)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| timeoutId | number | null | - | - |

**Returns**: (none)



### queueMicrotask(task: Function)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| task | Function | - | - |

**Returns**: (none)



### reportError(error: any)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| error | any | - | - |

**Returns**: (none)



### fetch(input: RequestInfo | URL, init?: RequestInit<RequestInitCfProperties>)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| input | RequestInfo | URL | - | - |
| init? | RequestInit<RequestInitCfProperties> | - | - |

**Returns**: (none)



### toString()

**Returns**: (none)



### toString()

**Returns**: (none)



### waitUntil(promise: Promise<unknown>)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| promise | Promise<unknown> | - | - |

**Returns**: (none)



### _connect(address: string | SocketAddress, options?: SocketOptions)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| address | string | SocketAddress | - | - |
| options? | SocketOptions | - | - |

**Returns**: (none)


