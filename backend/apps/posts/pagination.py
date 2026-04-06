from rest_framework.pagination import CursorPagination


class PostCursorPagination(CursorPagination):
    """
    Cursor-based pagination for the post feed.
    Cursor pagination is ideal for large, frequently-updated datasets:
      - No OFFSET scans (stable under inserts)
      - Clients cannot jump to arbitrary pages (prevents scraping)
      - O(1) per page regardless of dataset size
    """
    page_size = 20
    ordering = "-created_at"
    cursor_query_param = "cursor"


class CommentCursorPagination(CursorPagination):
    page_size = 30
    ordering = "created_at"
    cursor_query_param = "cursor"
