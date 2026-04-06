'use client'
import { useState, useEffect } from 'react'
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
  replies: Reply[]
}
interface Props { postId: string }

export default function CommentSection({ postId }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [likers, setLikers] = useState<{ list: any[]; title: string } | null>(null)

  useEffect(() => { load() }, [postId])

  const load = async () => {
    try {
      const { data } = await commentsApi.list(postId)
      setComments(data.results || data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await commentsApi.create(postId, newComment)
      setComments(prev => [...prev, { ...data, replies: [] }])
      setNewComment('')
    } catch { toast.error('Failed to post comment') }
    finally { setSubmitting(false) }
  }

  const submitReply = async (commentId: string) => {
    if (!replyText.trim()) return
    try {
      const { data } = await commentsApi.createReply(commentId, replyText)
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), data], reply_count: c.reply_count + 1 }
          : c
      ))
      setReplyText(''); setReplyTo(null)
    } catch { toast.error('Failed to post reply') }
  }

  const likeComment = async (comment: Comment) => {
    const was = comment.is_liked
    setComments(prev => prev.map(c =>
      c.id === comment.id ? { ...c, is_liked: !was, like_count: was ? c.like_count - 1 : c.like_count + 1 } : c
    ))
    try { await interactionsApi.likeComment(comment.id) }
    catch {
      setComments(prev => prev.map(c =>
        c.id === comment.id ? { ...c, is_liked: was, like_count: was ? c.like_count + 1 : c.like_count - 1 } : c
      ))
    }
  }

  const showCommentLikers = async (commentId: string) => {
    try {
      const { data } = await interactionsApi.commentLikers(commentId)
      setLikers({ list: data, title: 'People who liked this comment' })
    } catch { /* silent */ }
  }

  const likeReply = async (commentId: string, reply: Reply) => {
    const was = reply.is_liked
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? {
            ...c,
            replies: c.replies.map(r =>
              r.id === reply.id ? { ...r, is_liked: !was, like_count: was ? r.like_count - 1 : r.like_count + 1 } : r
            )
          }
        : c
    ))
    try { await interactionsApi.likeReply(reply.id) }
    catch {
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? {
              ...c,
              replies: c.replies.map(r =>
                r.id === reply.id ? { ...r, is_liked: was, like_count: was ? r.like_count + 1 : r.like_count - 1 } : r
              )
            }
          : c
      ))
    }
  }

  const showReplyLikers = async (replyId: string) => {
    try {
      const { data } = await interactionsApi.replyLikers(replyId)
      setLikers({ list: data, title: 'People who liked this reply' })
    } catch { /* silent */ }
  }

  if (loading) return <div className="_loading">Loading comments...</div>

  return (
    <div className="_feed_inner_timeline_cooment_area">
      {/* New comment input */}
      <div className="_feed_inner_comment_box">
        <div className="_feed_inner_comment_box_content">
          <img src="/assets/images/profile.png" alt="Image" className="_comment_img" />
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
               <img src="/assets/images/comment_img.png" alt="Image" className="_comment_img1" />
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

              {/* Reply input */}
              {replyTo === comment.id && (
                <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                   <img src="/assets/images/profile.png" alt="Image" className="_comment_img1" style={{ width: 26, height: 26 }} />
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
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="_comment_main">
                      <div className="_comment_image">
                         <img src="/assets/images/comment_img.png" alt="Image" className="_comment_img1" style={{ width: 26, height: 26 }} />
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
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {likers && (
        <LikersModal likers={likers.list} title={likers.title} onClose={() => setLikers(null)} />
      )}
    </div>
  )
}
