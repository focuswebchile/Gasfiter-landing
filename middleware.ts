import { NextRequest, NextResponse } from "next/server";

const CMS_HOST = "cms.abcis.cl";
const CMS_STAGING_PATH = "/staging?slug=abcis";

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const hostname = hostHeader.split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  if (hostname === CMS_HOST && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/staging";
    url.search = "slug=abcis";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
