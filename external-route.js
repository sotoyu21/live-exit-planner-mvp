// Official Maps URLs directions interface; no API key or fetched route data.
export function googleTransitUrl(origin, destination) {
  if (!origin?.trim() || !destination?.trim()) throw Error('到着地を入力してください');
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({api:'1', origin:origin.trim(), destination:destination.trim(), travelmode:'transit'}).toString();
  return url.href;
}
