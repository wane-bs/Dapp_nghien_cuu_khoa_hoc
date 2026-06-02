const fs = require('fs');

const data = fs.readFileSync('c:/book_app_v3/contracts/transaction_logs.csv', 'utf8').trim().split('\n');
const headers = data.shift().split(',');

const metrics = {};

data.forEach(line => {
    const cols = line.split(',');
    if (cols.length < 7) return;
    const type = cols[1];
    const gasUsed = parseInt(cols[3]);
    const costUSD = parseFloat(cols[5]);
    const ipfsMs = parseInt(cols[6]);

    if (!metrics[type]) {
        metrics[type] = { count: 0, totalGas: 0, totalCost: 0, totalIpfs: 0 };
    }

    metrics[type].count++;
    metrics[type].totalGas += gasUsed;
    metrics[type].totalCost += costUSD;
    metrics[type].totalIpfs += ipfsMs;
});

console.log("=== DSR METRICS SUMMARY ===");
for (const [type, m] of Object.entries(metrics)) {
    console.log(`Type: ${type} (Count: ${m.count})`);
    console.log(`  Avg Gas:      ${Math.round(m.totalGas / m.count)}`);
    console.log(`  Avg Cost USD: $${(m.totalCost / m.count).toFixed(6)}`);
    if (m.totalIpfs > 0) {
        console.log(`  Avg IPFS Ms:  ${(m.totalIpfs / m.count).toFixed(2)} ms`);
    }
}
