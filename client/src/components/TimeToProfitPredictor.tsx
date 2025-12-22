import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset } from "@shared/schema";

interface TPPResult {
  asset: string;
  currentRate: number;
  targetRate: number;
  targetDelta: number;
  lookbackMinutes: number;
  estimatedMinMinutes: number;
  estimatedMaxMinutes: number;
  probability: number;
  samples: number;
}

export function TimeToProfitPredictor() {
  const [asset, setAsset] = useState<Asset>("SOL");
  const [targetDelta, setTargetDelta] = useState<number>(3);
  const [lookback, setLookback] = useState<number>(45);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TPPResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch('/api/tpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, targetDelta, lookbackMinutes: lookback }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        setError(err?.error || 'Request failed');
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setResult(data as TPPResult);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border rounded-md bg-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Time-to-Profit Predictor</h3>
        <span className="text-xs text-muted-foreground">Near real-time</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <Select onValueChange={(v) => setAsset(v as Asset)} defaultValue={asset}>
          <SelectTrigger className="w-full text-sm h-8">
            <SelectValue placeholder="Asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SOL">SOL</SelectItem>
            <SelectItem value="BTC">BTC</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
            <SelectItem value="XAU">XAU</SelectItem>
          </SelectContent>
        </Select>

        <Input type="number" value={targetDelta} onChange={(e) => setTargetDelta(Number(e.target.value))} className="h-8 text-sm" />
      </div>

      <div className="mb-3">
        <label className="text-xs text-muted-foreground">Lookback (minutes)</label>
        <Input type="number" value={lookback} onChange={(e) => setLookback(Number(e.target.value))} className="h-8 text-sm mt-1" />
      </div>

      <div className="flex gap-2">
        <Button onClick={runAnalysis} disabled={loading} className="h-8">{loading ? 'Running...' : 'Analyze'}</Button>
        <Button variant="ghost" onClick={() => { setResult(null); setError(null); }} className="h-8">Reset</Button>
      </div>

      {error && <div className="mt-3 text-sm text-destructive">{error}</div>}

      {result && (
        <div className="mt-3 text-sm space-y-1">
          <div><strong>Current:</strong> ${result.currentRate.toFixed(4)}</div>
          <div><strong>Target:</strong> ${result.targetRate.toFixed(4)} ({result.targetDelta >=0 ? '+' : ''}{result.targetDelta.toFixed(4)})</div>
          <div><strong>Estimated Time:</strong> {result.estimatedMinMinutes === -1 ? 'N/A' : `${result.estimatedMinMinutes} - ${result.estimatedMaxMinutes} mins`}</div>
          <div><strong>Probability:</strong> {result.probability}%</div>
          <div className="text-xs text-muted-foreground">Samples analyzed: {result.samples}</div>
        </div>
      )}
    </div>
  );
}

export default TimeToProfitPredictor;
