async function simulateNetworkRequest(latencyMs: number, name: string) {
  return new Promise((resolve) => setTimeout(() => resolve(`Result for ${name}`), latencyMs));
}

async function runBenchmark() {
  const avgNetworkLatency = 50; // Assume 50ms roundtrip to DB

  console.log("Starting Benchmark...");

  // Method 1: Sequential (Current implementation)
  console.log("\n--- Sequential Queries (Current) ---");
  const startSequential = performance.now();

  // Query 1: User Profile
  await simulateNetworkRequest(avgNetworkLatency, "UserProfile");

  // Query 2: Partner Profile
  await simulateNetworkRequest(avgNetworkLatency, "PartnerProfile");

  const endSequential = performance.now();
  const sequentialTime = endSequential - startSequential;
  console.log(`Sequential time: ${sequentialTime.toFixed(2)} ms`);

  // Method 2: Join Query (Optimized)
  console.log("\n--- Join Query (Optimized) ---");
  const startJoin = performance.now();

  // Query 1: User Profile with Partner Join
  // DB does the join, slightly longer DB time but only one network roundtrip
  await simulateNetworkRequest(avgNetworkLatency + 5, "UserProfile+Partner Join");

  const endJoin = performance.now();
  const joinTime = endJoin - startJoin;
  console.log(`Join time: ${joinTime.toFixed(2)} ms`);

  // Results
  const improvement = sequentialTime - joinTime;
  const percentage = (improvement / sequentialTime) * 100;
  console.log(`\n--- Results ---`);
  console.log(`Improvement: ${improvement.toFixed(2)} ms (${percentage.toFixed(1)}%)`);
  console.log(`Roundtrips eliminated: 1`);
}

runBenchmark();
