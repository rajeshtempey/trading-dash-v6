import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";

const newsItems = [
  { id: 1, asset: "BTC", title: "Bitcoin Breaks Above 85K, Eyes Further Gains", sentiment: "bullish", date: "2 hours ago", source: "CryptoNews" },
  { id: 2, asset: "ETH", title: "Ethereum Upgrade Announcement Excites Community", sentiment: "bullish", date: "4 hours ago", source: "The Block" },
  { id: 3, asset: "SOL", title: "Solana Network Experiences Brief Outage", sentiment: "bearish", date: "6 hours ago", source: "CoinDesk" },
  { id: 4, asset: "BTC", title: "Fed Policy Drives Crypto Volatility Higher", sentiment: "neutral", date: "8 hours ago", source: "Bloomberg" },
  { id: 5, asset: "ETH", title: "Staking Rewards Hit All-Time High", sentiment: "bullish", date: "10 hours ago", source: "Ethereum Org" },
  { id: 6, asset: "XAU", title: "Gold Prices Surge on Currency Weakness", sentiment: "bullish", date: "12 hours ago", source: "MarketWatch" },
];

const sentimentScores = [
  { asset: "BTC", score: 72, trend: "up" },
  { asset: "ETH", score: 68, trend: "up" },
  { asset: "SOL", score: 45, trend: "down" },
  { asset: "XAU", score: 65, trend: "neutral" },
];

const getSentimentColor = (sentiment: string) => {
  if (sentiment === "bullish") return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
  if (sentiment === "bearish") return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
};

export function NewsSentiment() {
  return (
    <div className="space-y-6">
      {/* Sentiment Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sentimentScores.map((item) => (
          <Card key={item.asset}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{item.asset}</span>
                {item.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : item.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <div className="h-4 w-4 text-gray-500">—</div>
                )}
              </div>
              <div className="text-2xl font-bold">{item.score}%</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    item.score > 65 ? "bg-green-500" : item.score > 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest News */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Latest Market News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {newsItems.map((news) => (
            <div key={news.id} className={`p-3 rounded-lg border hover-elevate transition-colors ${getSentimentColor(news.sentiment)}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm line-clamp-2">{news.title}</div>
                  <div className="text-xs opacity-75 mt-1">{news.date} • {news.source}</div>
                </div>
                <Badge variant="outline" className="capitalize flex-shrink-0 text-xs">
                  {news.sentiment}
                </Badge>
              </div>
              <Badge variant="secondary" className="text-xs">{news.asset}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sentiment Summary */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Market Sentiment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Overall Sentiment</span>
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Bullish (62%)</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>News Momentum</span>
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Positive ↑</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Most Active Asset</span>
            <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400">BTC (72%)</Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Market showing strong bullish sentiment. Monitor for reversals around resistance levels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
