import { Button } from "@ui/button";
import usePopupStore from "./store";

export function ClassificationSection() {
  const activeURL = usePopupStore((state) => state.activeURL);
  const metadata = usePopupStore((state) => state.metadata) ?? {
    url: activeURL?.href ?? "",
  };
  if (!metadata && !activeURL) return null;

  const isLoading = usePopupStore((state) => state.isLoading);
  const isCurrentlyDistracting = usePopupStore(
    (state) => state.isCurrentlyDistracting,
  );
  const markAs = usePopupStore((state) => state.markAs);
  const isChannelOrSubredditDistracting = usePopupStore(
    (state) => state.isChannelOrSubredditDistracting,
  );

  const isYouTube = !!metadata.youtube?.channelId;
  const isReddit = !!metadata.reddit?.subreddit;

  console.log("isYouTube", isYouTube);
  console.log("isReddit", isReddit);
  console.log(
    "isChannelOrSubredditDistracting",
    isChannelOrSubredditDistracting,
  );

  let displayEle = <span>Mark page as</span>;

  if (isYouTube) {
    const channelName = metadata.youtube?.channelName || "Unknown Channel";
    const truncatedName = truncateText(channelName);
    displayEle = (
      <span>
        Mark channel <b>{truncatedName}</b> as
      </span>
    );
  } else if (isReddit) {
    const subredditName = metadata.reddit?.subreddit || "Unknown Subreddit";
    const truncatedName = truncateText(subredditName);
    displayEle = (
      <span>
        Mark <b>r/{truncatedName}</b> as
      </span>
    );
  }

  let markAsDistracting = !isCurrentlyDistracting;
  if (isYouTube || isReddit) {
    markAsDistracting = !isChannelOrSubredditDistracting;
    if (!isCurrentlyDistracting && isChannelOrSubredditDistracting === false) {
      // i.e, url is P, but channel/subreddit is D, then label should be 'mark url as P'
      markAsDistracting = true;
    }
  }

  displayEle = (
    <>
      {displayEle}
      <span
        className={
          "-ml-1 " + (markAsDistracting ? "text-primary" : "text-green-400")
        }
      >
        {markAsDistracting ? "Distracting" : "Productive"}
      </span>
    </>
  );
  const headerEle = (
    <h3 className="text-lg font-medium mb-3">
      {isChannelOrSubredditDistracting === false
        ? isYouTube
          ? "Current channel is "
          : "Current subreddit is "
        : "Current page is "}
      {isCurrentlyDistracting ? (
        <b className="text-primary">Distracting</b>
      ) : (
        <b className="text-green-400">Productive</b>
      )}
    </h3>
  );

  if (isYouTube || isReddit) {
    return (
      <div className="p-3 bg-card/30 border rounded-lg">
        {headerEle}
        <Button
          variant="secondary"
          disabled={isLoading}
          className="w-full justify-between"
          onClick={() => markAs(markAsDistracting, true)}
        >
          {displayEle}
        </Button>
        {isChannelOrSubredditDistracting && (
          <div className="flex flex-col gap-2 mt-2 justify-center items-center">
            <div className="text-muted-foreground">OR</div>
            <Button
              variant="secondary"
              disabled={isLoading}
              className="w-full"
              onClick={() => markAs(!isCurrentlyDistracting)}
            >
              Mark this Page as
              {isCurrentlyDistracting ? (
                <span className="-ml-1 text-green-400">Productive</span>
              ) : (
                <span className="-ml-1 text-primary">Distracting</span>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      {headerEle}
      <h3 className="text-lg font-medium text-gray-900 mb-3">Classification</h3>
      <Button
        variant="secondary"
        disabled={isLoading}
        className="w-full"
        onClick={() => markAs(!isCurrentlyDistracting)}
      >
        {displayEle}
      </Button>
    </div>
  );
}

function truncateText(text: string, maxLength = 16) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "…";
}
