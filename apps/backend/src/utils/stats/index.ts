import { feedStats } from "./feed.stats";

const analyze = async () => {
  const { newsMap, statsMap } = await feedStats();
  console.log(newsMap);
  console.log(statsMap);
};

analyze()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
