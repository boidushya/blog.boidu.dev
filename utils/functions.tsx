export function escapeQuotes(str: string) {
  // escape single and double quotes
  return str.replace(/(['"])/g, "\\&quot;");
}

export function isYouTubeLink(url: string) {
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];
  return youtubePatterns.some(pattern => pattern.test(url));
}

export function getYouTubeThumbnail(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

export function truncate(str: string, num: number) {
  if (str.length <= num) {
    return str;
  }
  const cut = str.slice(0, num);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,.;:!?-]+$/, "")}…`;
}

export function getAuthorData(id: string) {
  switch (id) {
    case "cubey":
      return { name: "Adalie", logo: "https://avatars.githubusercontent.com/u/59785640?v=4" };
    default:
      return { name: "Anon", logo: "https://api.dicebear.com/9.x/glass/png" };
  }
}

export function getAuthorsData(authorsList: Array<string>) {
  return authorsList.map(item => ({
    ...getAuthorData(item),
  }));
}
