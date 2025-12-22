const WebSocket = require('ws');

const url = 'ws://127.0.0.1:5000/ws';
const ws = new WebSocket(url);

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function run() {
  ws.on('open', async () => {
    console.log('connected');

    const timeframes = ['1m','5m','1h'];
    for (const tf of timeframes) {
      console.log('\n--- Subscribing to timeframe', tf);
      ws.send(JSON.stringify({ type: 'subscribe', asset: 'BTC', timeframe: tf, currency: 'USD' }));

      const candles = [];
      const onMessage = (msg) => {
        try {
          const m = JSON.parse(msg);
          if (m.type === 'candle' && m.asset === 'BTC') {
            candles.push(m.data);
          }
        } catch (e) {}
      };

      ws.on('message', onMessage);

      // wait a bit to receive initial batch
      await sleep(2000);

      ws.removeListener('message', onMessage);

      if (candles.length === 0) {
        console.log('No candles received for', tf);
        continue;
      }

      // compute time differences
      const times = candles.map(c => c.time).sort((a,b)=>a-b);
      const diffs = [];
      for (let i=1;i<times.length;i++) diffs.push(times[i]-times[i-1]);
      const median = diffs.length > 0 ? diffs.sort((a,b)=>a-b)[Math.floor(diffs.length/2)] : 0;
      console.log(`received ${candles.length} candles, median time diff: ${median} seconds`);
    }

    console.log('\nTest complete, closing');
    ws.close();
  });

  ws.on('error', (e) => console.error('ws error', e));
}

run();
