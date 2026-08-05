# Prompt 91 — Live Quest Discovery Search

- **Date:** 2026-08-06
- **Branch:** `feat/quest-highlight-badge`
- **Risk:** Low — frontend search interaction only

## Actual human instruction

The human provided a screenshot of the Discover Quest search field and asked:

> 搜索框做成不需要用户按回车确认，输入多少就开始搜索这种

## Implementation instruction

Update Quest discovery so typing in the search field automatically applies the
search without requiring Enter. Use a short debounce to avoid issuing a request
for every keystroke, keep the URL as the authoritative filter state, reset
pagination when the search changes, avoid adding a browser-history entry for
every live query, and retain browser-navigation synchronization. Add focused
integration coverage for the debounce, automatic query, and clearing behavior.
