import { FeedItem } from "icrypto.trade-types/feed";
import { getFeed } from "../../services/feed";

export const feedStats = async () => {
  const feed = await getFeed({
    limit: 10000,
    guess: true,
  });

  // create a map with key = symbol and value = array of news
  const newsMap = new Map();
  feed
    .filter((item) => item.likes >= 4)
    .forEach((item) => {
      const symbols = item.symbols;
      if (symbols === undefined) return;
      symbols.forEach((symbol: string) => {
        if (newsMap.has(symbol)) {
          const news = newsMap.get(symbol);
          news.push(item);
          newsMap.set(symbol, news);
        } else {
          newsMap.set(symbol, [item]);
        }
      });
    });

  // create a map with key = symbol and value = number of news
  const statsMap = new Map();
  newsMap.forEach((news: FeedItem[], symbol: string) => {
    statsMap.set(symbol, news.length);
  });

  return { newsMap, statsMap };
};
