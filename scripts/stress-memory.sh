#!/bin/bash
# MEMORY ALLOCATOR STRESS TEST SCRIPT
# Stresses the V8 heap and memory allocator under high concurrency to test GC behavior.

echo "🔥 Starting Memory Allocator & GC Stress Test..."

# Create a temporary Node.js stress worker
cat << 'EOF' > /tmp/memory_worker.js
const { workerData, parentPort } = require('worker_threads');

function stressAlloc() {
    const allocations = [];
    // Allocate 500MB rapidly
    for (let i = 0; i < 10; i++) {
        allocations.push(Buffer.alloc(50 * 1024 * 1024)); // 50MB
    }
    // Hold briefly then release references
    setTimeout(() => {
        allocations.length = 0;
        if (global.gc) global.gc();
    }, 1000);
}

// Run loop for 20 seconds
const end = Date.now() + 20000;
function loop() {
    if (Date.now() < end) {
        stressAlloc();
        setTimeout(loop, 200);
    } else {
        parentPort.postMessage('done');
    }
}

loop();
EOF

# Run 5 concurrent worker threads to hammer the memory allocator
CONCURRENCY=5
echo "⚙️ Spawning $CONCURRENCY concurrent stress workers (--expose-gc)..."

for ((i=1; i<=CONCURRENCY; i++))
do
    node --expose-gc /tmp/memory_worker.js &
done

# Monitor system memory during the test
echo "📊 Monitoring memory usage (Press Ctrl+C to stop)..."
for i in {1..20}
do
    free -h | grep Mem
    sleep 1
done

wait
echo "🏁 Memory stress test completed successfully."
rm /tmp/memory_worker.js
