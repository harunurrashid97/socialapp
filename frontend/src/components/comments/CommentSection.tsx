'use client'
import { useState, useEffect, useRef } from 'react'
import { commentsApi, interactionsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import LikersModal from '@/components/posts/LikersModal'
import { format } from 'timeago.js'
import toast from 'react-hot-toast'

interface Reply {
  id: string
  author: { id: string; full_name: string; email: string }
  content: string
  like_count: number
  is_liked: boolean
  created_at: string
}

interface Comment {
  id: string
  author: { id: string; full_name: string; email: string }
  content: string
  like_count: number
  reply_count: number
  is_liked: boolean
  created_at: string
}

interface Props { postId: string }

export default function CommentSection({ postId }: Props) {
  const { user } = useAuth()
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingCommentsMore, setLoadingCommentsMore] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Replies state
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({})
  const [repliesNextCursorMap, setRepliesNextCursorMap] = useState<Record<string, string | null>>({})
  const [repliesLoadingMap, setRepliesLoadingMap] = useState<Record<string, boolean>>({})
  const [repliesOpenMap, setRepliesOpenMap] = useState<Record<string, boolean>>({})
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  
  const [likers, setLikers] = useState<{ list: any[]; title: string } | null>(null)
  const likeInFlight = useRef<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [postId])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await commentsApi.list(postId)
      setComments(data.results || data)
      setCommentsNextCursor(data.next ? new URL(data.next).searchParams.get('cursor') : null)
    } catch {
      setError('Failed to load comments. Please try again.')
    } finally { setLoading(false) }
  }

  const loadMoreComments = async () => {
    if (!commentsNextCursor || loadingCommentsMore) return
    setLoadingCommentsMore(true)
    try {
      const { data } = await commentsApi.list(postId, commentsNextCursor)
      setComments(prev => [...prev, ...(data.results || data)])
      setCommentsNextCursor(data.next ? new URL(data.next).searchParams.get('cursor') : null)
    } catch {
      setError('Failed to load more comments.')
    } finally {
      setLoadingCommentsMore(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await commentsApi.create(postId, newComment)
      setComments(prev => [...prev, data])
      setNewComment('')
    } catch (err: any) {
      const errorData = err?.response?.data
      let errorMsg = 'Failed to post comment'
      if (errorData) {
        if (typeof errorData === 'string') errorMsg = errorData
        else if (errorData.content) {
          errorMsg = Array.isArray(errorData.content) ? errorData.content.join(' ') : errorData.content
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        }
      }
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleReplies = async (commentId: string) => {
    const isOpen = !!repliesOpenMap[commentId]
    setRepliesOpenMap(prev => ({ ...prev, [commentId]: !isOpen }))

    if (!isOpen && !repliesMap[commentId]) {
      await fetchReplies(commentId)
    }
  }

  const fetchReplies = async (commentId: string, cursor?: string) => {
    setRepliesLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const { data } = await commentsApi.replies(commentId, cursor)
      const results = data.results || data
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: cursor ? [...(prev[commentId] || []), ...results] : results
      }))
      setRepliesNextCursorMap(prev => ({
        ...prev,
        [commentId]: data.next ? new URL(data.next).searchParams.get('cursor') : null
      }))
    } catch {
      toast.error('Failed to load replies')
    } finally {
      setRepliesLoadingMap(prev => ({ ...prev, [commentId]: false }))
    }
  }

  const submitReply = async (commentId: string) => {
    if (!replyText.trim()) return
    try {
      const { data } = await commentsApi.createReply(commentId, replyText)
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, reply_count: c.reply_count + 1 }
          : c
      ))
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), data]
      }))
      setRepliesOpenMap(prev => ({ ...prev, [commentId]: true }))
      setReplyText(''); setReplyTo(null)
    } catch (err: any) {
      const errorData = err?.response?.data
      let errorMsg = 'Failed to post reply'
      if (errorData) {
        if (typeof errorData === 'string') errorMsg = errorData
        else if (errorData.content) {
          errorMsg = Array.isArray(errorData.content) ? errorData.content.join(' ') : errorData.content
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        }
      }
      toast.error(errorMsg)
    }
  }

  const likeComment = async (comment: Comment) => {
    if (likeInFlight.current.has(comment.id)) return
    likeInFlight.current.add(comment.id)

    const was = comment.is_liked
    setComments(prev => prev.map(c =>
      c.id === comment.id ? { ...c, is_liked: !was, like_count: was ? c.like_count - 1 : c.like_count + 1 } : c
    ))
    try { await interactionsApi.likeComment(comment.id) }
    catch {
      setComments(prev => prev.map(c =>
        c.id === comment.id ? { ...c, is_liked: was, like_count: was ? c.like_count + 1 : c.like_count - 1 } : c
      ))
    } finally {
      likeInFlight.current.delete(comment.id)
    }
  }

  const showCommentLikers = async (commentId: string) => {
    try {
      const { data } = await interactionsApi.commentLikers(commentId)
      setLikers({ list: data, title: 'People who liked this comment' })
    } catch {
      toast.error('Failed to load likers')
    }
  }

  const likeReply = async (commentId: string, reply: Reply) => {
    if (likeInFlight.current.has(reply.id)) return
    likeInFlight.current.add(reply.id)

    const was = reply.is_liked
    setRepliesMap(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || []).map(r =>
        r.id === reply.id ? { ...r, is_liked: !was, like_count: was ? r.like_count - 1 : r.like_count + 1 } : r
      )
    }))
    try { await interactionsApi.likeReply(reply.id) }
    catch {
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map(r =>
          r.id === reply.id ? { ...r, is_liked: was, like_count: was ? r.like_count + 1 : r.like_count - 1 } : r
        )
      }))
    } finally {
      likeInFlight.current.delete(reply.id)
    }
  }

  const showReplyLikers = async (replyId: string) => {
    try {
      const { data } = await interactionsApi.replyLikers(replyId)
      setLikers({ list: data, title: 'People who liked this reply' })
    } catch {
      toast.error('Failed to load likers')
    }
  }

  if (loading) return <div className="_loading">Loading comments...</div>

  return (
    <div className="_feed_inner_timeline_cooment_area">
      {error && (
        <div style={{ padding: 12, marginBottom: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4, color: '#ff4d4f', fontSize: 13 }}>
          {error}
          <button onClick={load} style={{ marginLeft: 12, cursor: 'pointer', background: 'none', border: 'none', color: '#377DFF', fontWeight: 600 }}>Retry</button>
        </div>
      )}
      {/* New comment input */}
      <div className="_feed_inner_comment_box">
        <div className="_feed_inner_comment_box_content">
          <img src="/assets/images/profile.png" alt="Profile" className="_comment_img" />
          <div className="_feed_inner_comment_box_content_txt" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea
              className="_comment_textarea"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
              rows={1}
            />
            <div className="_feed_inner_comment_box_icon">
               <button 
                className="_feed_inner_comment_box_icon_btn" 
                onClick={submitComment}
                disabled={submitting}
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                  </svg>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment list */}
      <div className="_timline_comment_main">
        {comments.map((comment) => (
          <div key={comment.id} className="_comment_main">
            <div className="_comment_image">
               <img src="/assets/images/comment_img.png" alt="Comment" className="_comment_img1" />
            </div>
            <div className="_comment_area">
              <div className="_comment_details">
                <h4 className="_comment_name_title">{comment.author.full_name}</h4>
                <p className="_comment_status_text">{comment.content}</p>
                
                {comment.like_count > 0 && (
                  <div className="_total_reactions">
                    <div className="_total_react">
                        <span className="_reaction_like">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M3.5 11l-.5 4s-.5 1 1 1 5 0 5 0 1 0 1-1V9l2-2.5V3s0-1-1-1H9s1-1-1-1-3 0-3 0-1 0-1 1v6L3.5 11z"/>
                           </svg>
                        </span>
                    </div>
                    <span className="_total" onClick={() => showCommentLikers(comment.id)} style={{ cursor: 'pointer' }}>{comment.like_count}</span>
                  </div>
                )}
              </div>

              <div className="_comment_reply">
                <ul className="_comment_reply_list">
                  <li>
                    <span
                      style={{ color: comment.is_liked ? 'var(--primary)' : undefined, fontWeight: comment.is_liked ? 600 : 500, cursor: 'pointer' }}
                      onClick={() => likeComment(comment)}
                    >
                      {comment.is_liked ? 'Liked' : 'Like'}
                    </span>
                  </li>
                  <li>
                    <span onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} style={{ cursor: 'pointer' }}>
                      Reply
                    </span>
                  </li>
                  <li><span className="_time_link">{format(comment.created_at)}</span></li>
                </ul>
              </div>

              {/* View Replies Toggle Link */}
              {comment.reply_count > 0 && (
                <div style={{ marginTop: 5, marginBottom: 5 }}>
                  <span 
                    onClick={() => toggleReplies(comment.id)} 
                    style={{ cursor: 'pointer', fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}
                  >
                    {repliesOpenMap[comment.id] ? 'Hide Replies' : `View Replies (${comment.reply_count})`}
                  </span>
                </div>
              )}

              {/* Reply input */}
              {replyTo === comment.id && (
                <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                   <img src="/assets/images/profile.png" alt="Profile" className="_comment_img1" style={{ width: 26, height: 26 }} />
                   <div style={{ flex: 1 }}>
                      <textarea
                        className="_comment_textarea"
                        placeholder={`Reply to ${comment.author.full_name}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={1}
                        style={{ fontSize: 12 }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(comment.id) } }}
                      />
                   </div>
                </div>
              )}

              {/* Replies list */}
              {repliesOpenMap[comment.id] && (
                <div style={{ marginTop: 10 }}>
                  {repliesLoadingMap[comment.id] && !repliesMap[comment.id] && (
                    <div style={{ fontSize: 11, color: 'var(--color3)', paddingLeft: 10 }}>Loading replies...</div>
                  )}

                  {repliesMap[comment.id] && repliesMap[comment.id].map((reply) => (
                    <div key={reply.id} className="_comment_main" style={{ marginLeft: 20 }}>
                      <div className="_comment_image">
                         <img src="/assets/images/comment_img.png" alt="Reply" className="_comment_img1" style={{ width: 26, height: 26 }} />
                      </div>
                      <div className="_comment_area">
                         <div className="_comment_details">
                            <h4 className="_comment_name_title" style={{ fontSize: 12 }}>{reply.author.full_name}</h4>
                            <p className="_comment_status_text" style={{ fontSize: 12 }}>{reply.content}</p>

                            {reply.like_count > 0 && (
                              <div className="_total_reactions">
                                <span className="_total" onClick={() => showReplyLikers(reply.id)} style={{ cursor: 'pointer', fontSize: 11 }}>{reply.like_count} Likes</span>
                              </div>
                            )}
                         </div>
                         <div className="_comment_reply">
                            <ul className="_comment_reply_list">
                               <li>
                                 <span 
                                   style={{ color: reply.is_liked ? 'var(--primary)' : undefined, fontWeight: reply.is_liked ? 600 : 500, cursor: 'pointer', fontSize: 11 }}
                                   onClick={() => likeReply(comment.id, reply)}
                                 >
                                   {reply.is_liked ? 'Liked' : 'Like'}
                                 </span>
                               </li>
                               <li><span className="_time_link" style={{ fontSize: 11 }}>{format(reply.created_at)}</span></li>
                            </ul>
                         </div>
                      </div>
                    </div>
                  ))}

                  {/* Load More Replies Link */}
                  {repliesNextCursorMap[comment.id] && (
                    <div style={{ paddingLeft: 20, marginTop: 5 }}>
                      <span
                        onClick={() => fetchReplies(comment.id, repliesNextCursorMap[comment.id] || undefined)}
                        style={{ cursor: 'pointer', fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}
                      >
                        {repliesLoadingMap[comment.id] ? 'Loading replies...' : 'Load More Replies'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Load More Comments Button */}
        {commentsNextCursor && (
          <div style={{ textAlign: 'center', marginTop: 15, marginBottom: 10 }}>
            <button 
              className="_right_info_btn_link"
              onClick={loadMoreComments}
              disabled={loadingCommentsMore}
              style={{ fontSize: 12, padding: '6px 16px', background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
            >
              {loadingCommentsMore ? 'Loading comments...' : 'Load More Comments'}
            </button>
          </div>
        )}
      </div>

      {likers && (
        <LikersModal likers={likers.list} title={likers.title} onClose={() => setLikers(null)} />
      )}
    </div>
  )
}
