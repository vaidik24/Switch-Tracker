export interface CsMicroTopicSeed {
  id: string;
  weekNumber: number;
  dayNumber: number;
  title: string;
  estMinutes: number;
  deliverable: string;
}

export const CS_MICRO_CURRICULUM: CsMicroTopicSeed[] = [
  // ──────────────────────────────────────────────
  // Week 1 — OS & Node.js Internals
  // ──────────────────────────────────────────────
  {
    id: 'cs-w1-d1-process-vs-thread',
    weekNumber: 1,
    dayNumber: 1,
    title: 'Process vs Thread Memory Layout',
    estMinutes: 20,
    deliverable:
      'Draw a diagram showing Stack, Heap, Code, and Data segments for a process; then show how threads share Heap and Code but have separate Stacks and TLS. Write a short note explaining context-switch costs (register save/restore, TLB flush for processes vs minimal overhead for threads) and when you would choose multi-process (isolation) vs multi-thread (shared state).',
  },
  {
    id: 'cs-w1-d2-node-event-loop',
    weekNumber: 1,
    dayNumber: 2,
    title: 'Node.js Libuv Event Loop Phases',
    estMinutes: 20,
    deliverable:
      'Sketch the six libuv event-loop phases (timers → pending callbacks → idle/prepare → poll → check → close callbacks). Write a code snippet that demonstrates the execution order of setTimeout(0), setImmediate, and process.nextTick inside and outside an I/O callback. Predict and verify the output.',
  },
  {
    id: 'cs-w1-d3-v8-memory-gc',
    weekNumber: 1,
    dayNumber: 3,
    title: 'V8 Memory & Garbage Collection',
    estMinutes: 20,
    deliverable:
      'Explain V8\'s generational GC: New Space (Scavenge / semi-space copy) vs Old Space (Mark-Sweep / Mark-Compact). List three common memory-leak triggers in Node.js (global caches without bounds, closures capturing large scopes, forgotten event listeners) and write a minimal reproduction of one leak using --max-old-space-size and process.memoryUsage().',
  },
  {
    id: 'cs-w1-d4-mutex-semaphore-deadlock',
    weekNumber: 1,
    dayNumber: 4,
    title: 'Concurrency: Mutex vs Semaphore & Deadlock Conditions',
    estMinutes: 15,
    deliverable:
      'Write definitions of Mutex (binary, ownership) and Semaphore (counting, no ownership) with a real-world analogy for each. List the four Coffman conditions for deadlock (mutual exclusion, hold-and-wait, no preemption, circular wait) and describe one practical strategy to break each condition (e.g., lock ordering to prevent circular wait).',
  },
  {
    id: 'cs-w1-d5-linux-io-epoll',
    weekNumber: 1,
    dayNumber: 5,
    title: 'Linux I/O: Blocking vs Non-blocking & Epoll',
    estMinutes: 15,
    deliverable:
      'Compare blocking I/O, non-blocking I/O (polling), select/poll, and epoll. Draw a timeline showing how epoll_wait avoids the O(n) scan of select. Explain edge-triggered vs level-triggered modes and why Node.js / libuv uses epoll (Linux) and kqueue (macOS) under the hood.',
  },
  {
    id: 'cs-w1-d6-node-streams-backpressure',
    weekNumber: 1,
    dayNumber: 6,
    title: 'Node.js Streams & Backpressure',
    estMinutes: 20,
    deliverable:
      'Build a small pipeline that reads a large file with fs.createReadStream, pipes through a Transform that uppercases text, and writes to fs.createWriteStream. Add logging inside the Transform to observe when the writable\'s internal buffer hits highWaterMark and the readable pauses. Explain how pipe() handles backpressure automatically vs manual drain event handling.',
  },
  {
    id: 'cs-w1-d7-cpu-scheduling',
    weekNumber: 1,
    dayNumber: 7,
    title: 'CPU Scheduling: Round Robin, CFS & Priority Queues',
    estMinutes: 15,
    deliverable:
      'Compare Round Robin (fixed time quantum), CFS (virtual runtime red-black tree), and Priority Queue scheduling. For a sample set of 4 processes with different burst times and priorities, compute the average waiting time under Round Robin (quantum=4) and Priority scheduling. Explain the trade-off between real-time (FIFO/RR classes) and time-sharing (CFS) in Linux.',
  },

  // ──────────────────────────────────────────────
  // Week 2 — DBMS & Indexing Deep Dive
  // ──────────────────────────────────────────────
  {
    id: 'cs-w2-d1-acid-properties',
    weekNumber: 2,
    dayNumber: 1,
    title: 'ACID Properties Deep Dive',
    estMinutes: 20,
    deliverable:
      'For each ACID property, write a one-paragraph explanation with a concrete SQL example showing what goes wrong without it. Detail how Atomicity is implemented via WAL (Write-Ahead Logging): explain the log-write → data-write → commit-record sequence and how crash recovery replays or undoes incomplete transactions.',
  },
  {
    id: 'cs-w2-d2-btree-bplus-indexes',
    weekNumber: 2,
    dayNumber: 2,
    title: 'B-Tree & B+ Tree Indexes',
    estMinutes: 20,
    deliverable:
      'Draw the B+ Tree structure for a composite index on (user_id, created_at) with order 4. Explain fan-out and why B+ Trees keep data only in leaf nodes (better range scans). Explain the leftmost prefix rule: why WHERE user_id=5 ORDER BY created_at uses the index but WHERE created_at > X alone does not.',
  },
  {
    id: 'cs-w2-d3-isolation-levels',
    weekNumber: 2,
    dayNumber: 3,
    title: 'SQL Isolation Levels & Anomalies',
    estMinutes: 20,
    deliverable:
      'Create a table mapping each isolation level (Read Uncommitted, Read Committed, Repeatable Read, Serializable) to the anomalies it permits (dirty read, non-repeatable read, phantom read). Write a concrete two-transaction interleaving scenario for each anomaly showing the before/after data states.',
  },
  {
    id: 'cs-w2-d4-mvcc-postgres',
    weekNumber: 2,
    dayNumber: 4,
    title: 'MVCC: How Postgres Implements Snapshots',
    estMinutes: 20,
    deliverable:
      'Explain xmin, xmax, and the transaction snapshot (active-transaction list) in Postgres. Walk through a two-transaction scenario showing how Transaction B sees the old version of a row updated by Transaction A (before A commits) using tuple visibility rules. Explain VACUUM\'s role in cleaning dead tuples.',
  },
  {
    id: 'cs-w2-d5-explain-analyze',
    weekNumber: 2,
    dayNumber: 5,
    title: 'EXPLAIN ANALYZE: Reading Query Plans',
    estMinutes: 15,
    deliverable:
      'Take a sample query with a JOIN and WHERE clause. Write out the EXPLAIN ANALYZE output you would expect and annotate each node: Seq Scan vs Index Scan vs Bitmap Index Scan, Nested Loop vs Hash Join vs Merge Join. Identify the most expensive node and propose an index or query rewrite to improve it.',
  },
  {
    id: 'cs-w2-d6-n-plus-1-connection-pool',
    weekNumber: 2,
    dayNumber: 6,
    title: 'N+1 Problem & Connection Pooling',
    estMinutes: 15,
    deliverable:
      'Write an ORM-style code snippet that causes the N+1 problem (fetching a list then querying each item\'s relation). Rewrite it with eager loading / JOIN. Then explain PgBouncer\'s three pooling modes (session, transaction, statement), when to use each, and the gotcha with prepared statements in transaction mode.',
  },
  {
    id: 'cs-w2-d7-locking-strategies',
    weekNumber: 2,
    dayNumber: 7,
    title: 'Optimistic vs Pessimistic Locking & Deadlock Handling',
    estMinutes: 15,
    deliverable:
      'Implement pseudo-code for optimistic locking (version column, CAS update) and pessimistic locking (SELECT FOR UPDATE). Describe a scenario where optimistic locking causes excessive retries and pessimistic is better. Explain Postgres deadlock detection (wait-for graph cycle detection) and prevention strategies (lock ordering, lock timeouts).',
  },

  // ──────────────────────────────────────────────
  // Week 3 — Networking & Auth Systems
  // ──────────────────────────────────────────────
  {
    id: 'cs-w3-d1-http-versions',
    weekNumber: 3,
    dayNumber: 1,
    title: 'HTTP/1.1 vs HTTP/2 vs HTTP/3',
    estMinutes: 20,
    deliverable:
      'Create a comparison table covering: connection model (persistent vs multiplexed), header compression (none vs HPACK vs QPACK), transport (TCP vs QUIC/UDP), and head-of-line blocking behavior at TCP layer. Explain why HTTP/2 still suffers TCP-level HOL blocking and how HTTP/3 with QUIC solves it via independent streams.',
  },
  {
    id: 'cs-w3-d2-tcp-handshake-congestion',
    weekNumber: 3,
    dayNumber: 2,
    title: 'TCP 3-Way Handshake & Congestion Control',
    estMinutes: 20,
    deliverable:
      'Draw the SYN → SYN-ACK → ACK handshake with sequence numbers. Explain slow start (exponential cwnd growth until ssthresh), congestion avoidance (AIMD: additive increase, multiplicative decrease), fast retransmit (3 duplicate ACKs), and flow control via the receive window. Calculate cwnd evolution for 5 RTTs given an initial cwnd=1 MSS and ssthresh=8.',
  },
  {
    id: 'cs-w3-d3-tls-handshake',
    weekNumber: 3,
    dayNumber: 3,
    title: 'TLS 1.3 Handshake & Perfect Forward Secrecy',
    estMinutes: 15,
    deliverable:
      'Draw the TLS 1.3 1-RTT handshake (ClientHello with key share → ServerHello with key share + encrypted extensions + certificate + finished → Client finished). Explain how ephemeral Diffie-Hellman (ECDHE) provides perfect forward secrecy: even if the server\'s long-term private key is compromised, past session keys remain safe.',
  },
  {
    id: 'cs-w3-d4-dns-resolution',
    weekNumber: 3,
    dayNumber: 4,
    title: 'DNS Resolution & Security',
    estMinutes: 15,
    deliverable:
      'Trace a full DNS resolution from browser cache → OS cache → recursive resolver → root → TLD → authoritative server. Explain TTL, the difference between CNAME and A records, when to use each, and how DNS cache poisoning works (forged responses with matching transaction IDs). Mention DNSSEC as the mitigation.',
  },
  {
    id: 'cs-w3-d5-websockets-sse',
    weekNumber: 3,
    dayNumber: 5,
    title: 'WebSockets vs SSE vs Long Polling',
    estMinutes: 15,
    deliverable:
      'Create a comparison matrix of WebSockets, SSE, and long polling covering: direction (full-duplex vs server-push), protocol overhead, reconnection behavior, browser support, and best use cases. Write the HTTP Upgrade handshake for WebSockets (Connection: Upgrade, Upgrade: websocket, Sec-WebSocket-Key). Explain the ping/pong keep-alive mechanism.',
  },
  {
    id: 'cs-w3-d6-jwt-deep-dive',
    weekNumber: 3,
    dayNumber: 6,
    title: 'JWT: Structure, Signing & Token Rotation',
    estMinutes: 20,
    deliverable:
      'Decode a sample JWT and label each Base64-decoded section (header with alg/typ, payload with sub/iat/exp/custom claims, signature). Compare RS256 (asymmetric, public key verification) vs HS256 (symmetric shared secret). Design a refresh-token rotation flow: issue short-lived access token + long-lived refresh token, detect reuse of a revoked refresh token.',
  },
  {
    id: 'cs-w3-d7-oauth2-flows',
    weekNumber: 3,
    dayNumber: 7,
    title: 'OAuth 2.0 Flows & PKCE',
    estMinutes: 20,
    deliverable:
      'Draw sequence diagrams for: (1) Authorization Code flow with PKCE (code_verifier, code_challenge, S256 transform) for a public client (SPA), (2) Client Credentials flow for service-to-service. Explain why implicit flow is deprecated, what token introspection is, and when to use opaque tokens vs self-contained JWTs.',
  },

  // ──────────────────────────────────────────────
  // Week 4 — LLD 1-4
  // ──────────────────────────────────────────────
  {
    id: 'cs-w4-d1-lru-cache',
    weekNumber: 4,
    dayNumber: 1,
    title: 'LRU Cache: Doubly Linked List + HashMap',
    estMinutes: 20,
    deliverable:
      'Implement an LRU Cache class in TypeScript with O(1) get and put using a Map (preserving insertion order) or a custom doubly linked list + HashMap. Include capacity constructor parameter, get(key) that promotes to most-recent, and put(key, value) that evicts least-recent when full. Write at least 5 unit-test scenarios covering eviction, update, and capacity-1 edge case.',
  },
  {
    id: 'cs-w4-d2-lfu-cache',
    weekNumber: 4,
    dayNumber: 2,
    title: 'LFU Cache: Frequency-Based Eviction',
    estMinutes: 20,
    deliverable:
      'Implement an LFU Cache in TypeScript using a HashMap for key→value+freq and a frequency→doubly-linked-list map (O(1) eviction by tracking minFreq). Handle tie-breaking by evicting the least recently used among least-frequent items. Compare the trade-offs vs LRU: when LFU outperforms (stable access patterns) vs when it struggles (frequency accumulation for stale keys).',
  },
  {
    id: 'cs-w4-d3-rate-limiter-token-bucket',
    weekNumber: 4,
    dayNumber: 3,
    title: 'Rate Limiter: Token Bucket & Fixed/Sliding Window',
    estMinutes: 20,
    deliverable:
      'Implement a Token Bucket rate limiter in TypeScript: configure bucket capacity and refill rate, expose an allowRequest() method that returns boolean. Then describe Fixed Window and Sliding Window Log algorithms with their trade-offs (memory, burst behavior, boundary issues). Draw a timeline showing how fixed window allows 2× burst at window boundaries.',
  },
  {
    id: 'cs-w4-d4-rate-limiter-distributed',
    weekNumber: 4,
    dayNumber: 4,
    title: 'Rate Limiter: Sliding Window Counter & Distributed',
    estMinutes: 15,
    deliverable:
      'Implement the Sliding Window Counter algorithm (weighted average of current and previous window counts). Then design a distributed rate limiter using Redis INCR + EXPIRE or a Lua script for atomicity. Address race conditions, clock skew between nodes, and the trade-off between local rate limiting (fast but approximate) vs centralized (accurate but adds latency).',
  },
  {
    id: 'cs-w4-d5-parking-lot',
    weekNumber: 4,
    dayNumber: 5,
    title: 'Parking Lot: OOP Design & Class Hierarchy',
    estMinutes: 20,
    deliverable:
      'Design a Parking Lot system with classes: ParkingLot, Level, ParkingSpot (Compact, Regular, Large), Vehicle (Motorcycle, Car, Bus), Ticket, PaymentProcessor. Draw a UML class diagram showing relationships. Implement core methods: parkVehicle (finds best-fit spot), unparkVehicle (calculates fee by duration), and getAvailability. Handle edge cases: bus needs 5 contiguous large spots.',
  },
  {
    id: 'cs-w4-d6-tic-tac-toe',
    weekNumber: 4,
    dayNumber: 6,
    title: 'Tic-Tac-Toe: O(1) Win Detection',
    estMinutes: 15,
    deliverable:
      'Implement a Tic-Tac-Toe game in TypeScript with O(1) win detection per move: maintain row counts, column counts, diagonal count, and anti-diagonal count for each player. A move wins when any count reaches board size. Make the board size configurable (n×n). Write a Game class with makeMove(row, col, player) returning the game state (ongoing, win, draw).',
  },
  {
    id: 'cs-w4-d7-lld-review',
    weekNumber: 4,
    dayNumber: 7,
    title: 'Review & Re-implement Weakest LLD',
    estMinutes: 20,
    deliverable:
      'Identify which of the six LLD problems from this week felt weakest. Re-implement it completely from scratch without looking at your previous solution. Compare the two implementations: note where the second attempt is cleaner, any bugs you caught, and any design pattern you applied differently. Write a brief retrospective on what you learned.',
  },

  // ──────────────────────────────────────────────
  // Week 5 — LLD 5-8
  // ──────────────────────────────────────────────
  {
    id: 'cs-w5-d1-bookmyshow',
    weekNumber: 5,
    dayNumber: 1,
    title: 'BookMyShow: Seat Selection & Booking Flow',
    estMinutes: 20,
    deliverable:
      'Design a movie ticket booking system. Model: Movie, Show, Screen, Seat, Booking, Payment. Implement seat selection with optimistic locking (version column on Seat or a temporary 5-minute hold via expiring reservation). Draw a sequence diagram showing: user selects seats → seats temporarily held → payment processed → booking confirmed (or hold released on timeout/failure).',
  },
  {
    id: 'cs-w5-d2-splitwise',
    weekNumber: 5,
    dayNumber: 2,
    title: 'Splitwise: Expense Model & Debt Simplification',
    estMinutes: 20,
    deliverable:
      'Design the data model for Splitwise: User, Group, Expense (equal, exact, percentage splits). Implement the simplify-debts algorithm: compute net balance per user, use a greedy approach (match max creditor with max debtor) to minimize the number of transactions. Walk through an example with 4 users and 3 expenses, showing before and after simplification.',
  },
  {
    id: 'cs-w5-d3-elevator-system',
    weekNumber: 5,
    dayNumber: 3,
    title: 'Elevator System: Scheduling Algorithms',
    estMinutes: 20,
    deliverable:
      'Design an Elevator System with classes: Building, Elevator, Request (floor, direction), Scheduler. Implement the SCAN (elevator) algorithm: move in one direction servicing all requests, then reverse. Compare with LOOK (reverse when no more requests ahead). Extend to multi-elevator coordination: assign requests to the nearest elevator moving in the compatible direction.',
  },
  {
    id: 'cs-w5-d4-inmemory-kv-ttl',
    weekNumber: 5,
    dayNumber: 4,
    title: 'In-Memory KV Store with TTL',
    estMinutes: 20,
    deliverable:
      'Implement an in-memory key-value store in TypeScript with TTL support. Use a HashMap for data and a min-heap (priority queue) ordered by expiry time for cleanup. Implement both lazy expiry (check on get) and active expiry (periodic sweep of expired keys). Expose: set(key, value, ttlMs), get(key), delete(key). Write tests covering: normal get, expired key returns null, overwrite resets TTL.',
  },
  {
    id: 'cs-w5-d5-snake-and-ladder',
    weekNumber: 5,
    dayNumber: 5,
    title: 'Snake and Ladder: Game State Machine',
    estMinutes: 15,
    deliverable:
      'Design a Snake and Ladder game using the State pattern. Model: Board (configurable size, snakes, ladders), Player, Dice, Game (state machine: WAITING_FOR_ROLL → MOVING → CHECK_SNAKE_LADDER → NEXT_TURN or WON). Implement the game loop for 2-4 players. Handle edge cases: exact landing on 100 to win, multiple consecutive snakes/ladders, and configurable board.',
  },
  {
    id: 'cs-w5-d6-logger-pubsub',
    weekNumber: 5,
    dayNumber: 6,
    title: 'Logger / Pub-Sub System with Observer Pattern',
    estMinutes: 15,
    deliverable:
      'Build a logging framework using the Observer pattern. Implement: Logger (singleton with log levels: DEBUG, INFO, WARN, ERROR), LogAppender interface (ConsoleAppender, FileAppender), and a topic-based Pub-Sub system where appenders subscribe to specific log levels. Add async appender support using a queue to avoid blocking the caller. Demonstrate with a code snippet.',
  },
  {
    id: 'cs-w5-d7-lld-mini-project',
    weekNumber: 5,
    dayNumber: 7,
    title: 'Review & Integrate: Mini-Project Combining 2 LLD Patterns',
    estMinutes: 20,
    deliverable:
      'Build a mini-project that combines at least two LLD designs: e.g., a rate-limited API with an LRU cache backend, or a BookMyShow service with a pub-sub notification system for booking confirmations. Write clean TypeScript with interfaces, dependency injection, and at least 3 integration tests. Write a brief design-doc explaining your choices.',
  },

  // ──────────────────────────────────────────────
  // Week 6 — HLD Core
  // ──────────────────────────────────────────────
  {
    id: 'cs-w6-d1-load-balancers',
    weekNumber: 6,
    dayNumber: 1,
    title: 'Load Balancers: L4 vs L7 & Algorithms',
    estMinutes: 20,
    deliverable:
      'Compare L4 (transport-level, IP+port, NAT/DSR) vs L7 (application-level, HTTP headers, URL routing) load balancers. Describe algorithms: round-robin, weighted round-robin, least connections, IP hash, and consistent hashing with virtual nodes. Draw a diagram showing consistent hashing ring with 3 servers and 150 virtual nodes, then show what happens when one server is removed.',
  },
  {
    id: 'cs-w6-d2-cdn',
    weekNumber: 6,
    dayNumber: 2,
    title: 'CDN: Architecture & Cache Invalidation',
    estMinutes: 15,
    deliverable:
      'Explain Pull CDN (origin fetch on cache miss, simpler) vs Push CDN (pre-populate, better for predictable content). Draw the PoP (Point of Presence) architecture: edge server → shield/mid-tier → origin. Discuss cache invalidation strategies: TTL-based, purge API, versioned URLs (fingerprinting), and stale-while-revalidate. Explain edge computing use cases (A/B testing, auth at edge).',
  },
  {
    id: 'cs-w6-d3-caching-strategies',
    weekNumber: 6,
    dayNumber: 3,
    title: 'Caching Strategies & Stampede Mitigation',
    estMinutes: 20,
    deliverable:
      'Describe four caching strategies with diagrams: Cache-Aside (application manages), Read-Through (cache manages reads), Write-Through (cache manages writes synchronously), Write-Behind (cache writes async). For each, state the consistency guarantees and failure modes. Explain cache stampede (thundering herd) and three mitigations: locking (single recompute), probabilistic early expiry, and stale-while-revalidate.',
  },
  {
    id: 'cs-w6-d4-redis-deep-dive',
    weekNumber: 6,
    dayNumber: 4,
    title: 'Redis: Data Structures, Persistence & Pub/Sub',
    estMinutes: 20,
    deliverable:
      'List Redis data structures (String, List, Set, Sorted Set, Hash, HyperLogLog, Stream) with one real-world use case each. Compare persistence: RDB (point-in-time snapshots, fast recovery, data loss window) vs AOF (append log, slower recovery, less data loss). Explain Redis pub/sub limitations (no persistence of messages, no consumer groups) vs Redis Streams. Write a Lua script example for atomic increment-and-check.',
  },
  {
    id: 'cs-w6-d5-kafka-deep-dive',
    weekNumber: 6,
    dayNumber: 5,
    title: 'Kafka: Partitions, Consumer Groups & Exactly-Once',
    estMinutes: 20,
    deliverable:
      'Draw Kafka architecture: producers → topics (with partitions) → consumer groups. Explain partition assignment, how consumer group rebalancing works, and offset management (auto-commit vs manual commit). Describe exactly-once semantics: idempotent producer (PID + sequence number) + transactional writes + read_committed isolation level. Explain when to use Kafka vs Redis pub/sub vs RabbitMQ.',
  },
  {
    id: 'cs-w6-d6-database-sharding',
    weekNumber: 6,
    dayNumber: 6,
    title: 'Database Sharding: Strategies & Resharding',
    estMinutes: 15,
    deliverable:
      'Compare horizontal sharding (split rows) vs vertical sharding (split columns/tables). Discuss shard key selection criteria: cardinality, write distribution, query patterns. Explain the resharding problem and solutions: consistent hashing, virtual shards, Vitess (vtgate routing, vschema). Address cross-shard queries and distributed transactions (2PC limitations).',
  },
  {
    id: 'cs-w6-d7-cap-consistency',
    weekNumber: 6,
    dayNumber: 7,
    title: 'CAP Theorem, PACELC & Consistency Models',
    estMinutes: 15,
    deliverable:
      'State the CAP theorem and explain why it is about network partitions (you always want C and A, but during P you must choose). Extend to PACELC: during Partition choose A or C, Else choose Latency or Consistency. Create a table of consistency models (strong, linearizable, sequential, causal, eventual, read-your-writes) with a real system example for each (e.g., Spanner = strong, DynamoDB = eventual with optional strong).',
  },

  // ──────────────────────────────────────────────
  // Week 7 — HLD Systems
  // ──────────────────────────────────────────────
  {
    id: 'cs-w7-d1-url-shortener',
    weekNumber: 7,
    dayNumber: 1,
    title: 'URL Shortener: Encoding, Storage & Analytics',
    estMinutes: 20,
    deliverable:
      'Design a URL shortener end to end. Compare ID generation strategies: auto-increment counter + Base62 encode vs MD5/SHA256 hash truncation (collision handling). Estimate storage for 100M URLs. Design the read path (read-heavy: cache short→long mapping in Redis, 301 vs 302 redirect trade-offs). Add an analytics layer: track click count, referrer, geo, and user-agent with async writes to an analytics store.',
  },
  {
    id: 'cs-w7-d2-whatsapp-chat',
    weekNumber: 7,
    dayNumber: 2,
    title: 'WhatsApp / Chat System Design',
    estMinutes: 20,
    deliverable:
      'Design a real-time chat system. Cover: persistent WebSocket connection management (connection gateway), message delivery (online: push via WebSocket; offline: store-and-forward), message ordering (per-conversation sequence IDs), read receipts (sent → delivered → read state machine), group messaging (fan-out to group members). Briefly describe E2E encryption: Signal Protocol, key exchange, ratcheting.',
  },
  {
    id: 'cs-w7-d3-notification-system',
    weekNumber: 7,
    dayNumber: 3,
    title: 'Notification System: Fan-out & Multi-Channel',
    estMinutes: 15,
    deliverable:
      'Design a notification platform supporting push (FCM/APNs), SMS, email, and in-app channels. Architecture: event producers → notification service → priority queue (urgent vs batched) → channel-specific workers → delivery providers. Handle: user preference management, rate limiting per user, deduplication (idempotency key), retry with exponential backoff, and delivery status tracking.',
  },
  {
    id: 'cs-w7-d4-video-upload-processing',
    weekNumber: 7,
    dayNumber: 4,
    title: 'Video Upload & Processing Pipeline',
    estMinutes: 20,
    deliverable:
      'Design a video upload and streaming system. Cover: chunked upload with resumability (tus protocol), upload to object storage (S3), transcoding pipeline (DAG of tasks: thumbnail extraction, multiple resolution encoding, audio normalization), adaptive bitrate streaming (HLS/DASH with manifest file listing segments at different qualities). Include a state machine for video status: uploading → processing → ready → failed.',
  },
  {
    id: 'cs-w7-d5-distributed-payment',
    weekNumber: 7,
    dayNumber: 5,
    title: 'Distributed Payment System & Saga Pattern',
    estMinutes: 20,
    deliverable:
      'Design a payment system handling $1M+ daily transactions. Cover: idempotency keys (client-generated UUID, server dedup), double-entry ledger (every transaction = debit + credit entries), Saga pattern for distributed transactions (e.g., reserve balance → charge payment provider → confirm booking, with compensating transactions on failure). Discuss reconciliation: periodic comparison of internal ledger vs payment provider records.',
  },
  {
    id: 'cs-w7-d6-news-feed',
    weekNumber: 7,
    dayNumber: 6,
    title: 'News Feed: Fan-out Strategies & Ranking',
    estMinutes: 20,
    deliverable:
      'Design a social media news feed. Compare fan-out-on-write (precompute feed on post, fast reads, expensive for celebrities with millions of followers) vs fan-out-on-read (compute at read time, better for high-follower users). Propose a hybrid: fan-out-on-write for normal users, fan-out-on-read for celebrities. Describe the ranking algorithm inputs (recency, engagement, affinity, content type) and how to blend ranked + chronological content.',
  },
  {
    id: 'cs-w7-d7-hld-mock-interview',
    weekNumber: 7,
    dayNumber: 7,
    title: 'Design Review: Mock HLD Interview',
    estMinutes: 20,
    deliverable:
      'Pick a random system from weeks 6-7 and practice a 20-minute mock HLD interview. Follow the framework: (1) clarify requirements & scope (2 min), (2) estimate scale (1 min), (3) high-level design with component diagram (5 min), (4) deep dive into 2-3 components (8 min), (5) address bottlenecks and trade-offs (4 min). Record your talking points and self-evaluate: did you drive the conversation, ask good clarifying questions, and justify trade-offs?',
  },

  // ──────────────────────────────────────────────
  // Week 8 — Behavioural & Final Interview Polish
  // ──────────────────────────────────────────────
  {
    id: 'cs-w8-d1-star-method',
    weekNumber: 8,
    dayNumber: 1,
    title: 'STAR Method Mastery',
    estMinutes: 15,
    deliverable:
      'Write a template for the STAR format: Situation (set the scene in 2 sentences), Task (your specific responsibility), Action (what YOU did, using "I" not "we", with technical detail), Result (quantified impact: metrics improved, time saved, revenue generated). Draft two complete STAR stories from your experience, each timed to 2-3 minutes when spoken aloud. Highlight where you quantified impact.',
  },
  {
    id: 'cs-w8-d2-ownership-stories',
    weekNumber: 8,
    dayNumber: 2,
    title: 'Ownership Stories: Initiative Beyond Job Description',
    estMinutes: 15,
    deliverable:
      'Prepare two STAR stories showing ownership: (1) a time you identified a problem no one assigned you and drove the fix end-to-end, (2) a time you went beyond your role to unblock the team (e.g., wrote documentation, set up CI/CD, fixed a flaky test suite). For each, emphasize the before/after state and the lasting impact on the team or product.',
  },
  {
    id: 'cs-w8-d3-conflict-resolution',
    weekNumber: 8,
    dayNumber: 3,
    title: 'Conflict Resolution: Disagree and Commit',
    estMinutes: 15,
    deliverable:
      'Prepare a STAR story about a technical disagreement with a colleague or manager. Structure it as: what you believed, what they believed, how you gathered data or ran an experiment to resolve it, and the outcome. Show that you can disagree respectfully, present evidence, and commit fully to the decision once made — even if it wasn\'t your preferred approach. Include the concrete business or technical outcome.',
  },
  {
    id: 'cs-w8-d4-technical-leadership',
    weekNumber: 8,
    dayNumber: 4,
    title: 'Technical Leadership Stories',
    estMinutes: 15,
    deliverable:
      'Prepare a STAR story demonstrating technical leadership: mentoring a junior developer (what you taught, how they grew), establishing a code review culture (what standards you introduced, how quality improved), or driving an RFC/design doc process (a specific proposal you authored, the feedback cycle, the outcome). Quantify the impact: e.g., "reduced production incidents by 40%" or "onboarding time dropped from 3 weeks to 1 week".',
  },
  {
    id: 'cs-w8-d5-failure-learning',
    weekNumber: 8,
    dayNumber: 5,
    title: 'Failure & Learning: Biggest Mistake Story',
    estMinutes: 15,
    deliverable:
      'Prepare a STAR story about your biggest professional mistake or failure. Focus 70% of the story on recovery and systemic fix, not the mistake itself. Show: (1) what went wrong and your role in it, (2) how you detected and mitigated the immediate impact, (3) the systemic change you implemented to prevent recurrence (e.g., added monitoring, wrote a runbook, changed the deployment process). End with what you learned and how it changed your approach.',
  },
  {
    id: 'cs-w8-d6-salary-negotiation',
    weekNumber: 8,
    dayNumber: 6,
    title: 'Salary Negotiation Strategy',
    estMinutes: 15,
    deliverable:
      'Research market rates for your target role and level using Levels.fyi, Glassdoor, and Blind. Document your BATNA (Best Alternative to Negotiated Agreement). Prepare a negotiation script: (1) express enthusiasm, (2) state your researched range with justification, (3) handle common pushbacks ("budget is fixed", "we can revisit in 6 months"), (4) negotiate beyond base salary (signing bonus, RSU refresh, remote flexibility, title). Practice the script aloud twice.',
  },
  {
    id: 'cs-w8-d7-mock-behavioral',
    weekNumber: 8,
    dayNumber: 7,
    title: 'Mock Behavioral Interview Practice',
    estMinutes: 20,
    deliverable:
      'Run a full mock behavioral interview: set a 30-minute timer and answer these prompts using your prepared stories: (1) Tell me about yourself (2 min pitch), (2) Biggest ownership moment, (3) A time you disagreed with your team, (4) How you handled a failure, (5) Why this company? Practice transitions between stories. Self-evaluate: were answers 2-3 minutes each, did you quantify impact, did you avoid rambling? Note areas to tighten.',
  },
];
