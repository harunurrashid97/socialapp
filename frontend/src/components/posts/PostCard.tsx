'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { postsApi, interactionsApi } from '@/lib/api'
import CommentSection from '@/components/comments/CommentSection'
import LikersModal from './LikersModal'
import toast from 'react-hot-toast'
import { format } from 'timeago.js'

import PostCreate from './PostCreate'
import ReactionPicker, { ReactionType } from './ReactionPicker'

interface Author { id: string; full_name: string; email: string }
interface Post {
  id: string; content: string; image: string | null; visibility: string
  like_count: number; comment_count: number; is_liked: boolean
  reaction_type: ReactionType | null
  created_at: string; author: Author
}
interface Props { post: Post; onDeleted: (id: string) => void; onUpdated: (post: Post) => void }

export default function PostCard({ post, onDeleted, onUpdated }: Props) {
  const { user } = useAuth()
  const [dropOpen, setDropOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [likers, setLikers] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [showLikers, setShowLikers] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editVisibility, setEditVisibility] = useState(post.visibility)
  const [editLoading, setEditLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const isOwner = user?.id === post.author.id
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  const handleLike = async (reactType?: ReactionType) => {
    // Optimistic Logic
    const oldPost = { ...post }
    let newIsLiked = !post.is_liked
    let newCount = post.is_liked ? post.like_count - 1 : post.like_count + 1
    let newReact = reactType || 'like'

    if (reactType && post.is_liked && post.reaction_type !== reactType) {
      newIsLiked = true
      newCount = post.like_count
      newReact = reactType
    } else if (!reactType && post.is_liked) {
      newIsLiked = false
      newCount = post.like_count - 1
      newReact = null as any
    }

    onUpdated({ ...post, is_liked: newIsLiked, like_count: Math.max(0, newCount), reaction_type: newReact as any })
    setShowPicker(false)

    try {
      const { data } = await interactionsApi.likePost(post.id, reactType)
      onUpdated({ ...post, is_liked: data.liked, like_count: data.like_count, reaction_type: data.reaction_type })
    } catch {
      toast.error('Failed to react')
      onUpdated(oldPost)
    }
  }

  const handleShowLikers = async () => {
    try {
      const { data } = await interactionsApi.postLikers(post.id)
      setLikers(data); setShowLikers(true)
    } catch {}
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await postsApi.delete(post.id)
      toast.success('Post deleted')
      onDeleted(post.id)
    } catch { toast.error('Failed to delete') }
    setDropOpen(false)
  }

  const handleEdit = async () => {
    if (!editContent.trim()) { toast.error('Content cannot be blank'); return }
    setEditLoading(true)
    try {
      const fd = new FormData()
      fd.append('content', editContent)
      fd.append('visibility', editVisibility.toLowerCase())
      const { data } = await postsApi.update(post.id, fd)
      onUpdated(data)
      setEditing(false)
      toast.success('Post updated')
    } catch { toast.error('Failed to update') }
    finally { setEditLoading(false) }
  }

  const getReactionIcon = (type: ReactionType | null, isLiked: boolean) => {
    switch (type) {
      case 'love':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="#F33E58" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        )
      case 'haha':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none" viewBox="0 0 19 19">
            <path fill="#FFCC4D" d="M9.5 19a9.5 9.5 0 100-19 9.5 9.5 0 000 19z"/>
            <path fill="#664500" d="M9.5 11.083c-1.912 0-3.181-.222-4.75-.527-.358-.07-1.056 0-1.056 1.055 0 2.111 2.425 4.75 5.806 4.75 3.38 0 5.805-2.639 5.805-4.75 0-1.055-.697-1.125-1.055-1.055-1.57.305-2.838.527-4.75.527z"/>
            <path fill="#fff" d="M4.75 11.611s1.583.528 4.75.528 4.75-.528 4.75-.528-1.056 2.111-4.75 2.111-4.75-2.11-4.75-2.11z"/>
            <path fill="#664500" d="M6.333 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847zM12.667 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847z"/>
          </svg>
        )
      case 'wow':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#FFCC4D"/>
            <ellipse cx="8" cy="9" rx="2" ry="3" fill="#664500"/>
            <ellipse cx="16" cy="9" rx="2" ry="3" fill="#664500"/>
            <circle cx="12" cy="17" r="4" fill="#664500"/>
          </svg>
        )
      case 'sad':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#FFCC4D"/>
            <circle cx="8" cy="10" r="1.5" fill="#664500"/>
            <circle cx="16" cy="10" r="1.5" fill="#664500"/>
            <path d="M8 18c2-2 6-2 8 0" stroke="#664500" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M16 11c0 2-1 4-1 4" stroke="#377DFF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'angry':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#F33E58"/>
            <path d="M6 10l4 2m8-2l-4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="8" cy="14" r="1.5" fill="#fff"/>
            <circle cx="16" cy="14" r="1.5" fill="#fff"/>
            <path d="M8 19c2-1 6-1 8 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        )
      case 'like':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill={isLiked ? "#377DFF" : "none"} viewBox="0 0 24 24">
            <path stroke={isLiked ? "#377DFF" : "#666"} d="M4 21h1V8H4a2 2 0 00-2 2v9a2 2 0 002 2zM20 8h-7l1.122-3.368A2 2 0 0012.225 2H12L7 8v13h9c1.35 0 2.53-.9 2.89-2.2l1.64-5.94A2 2 0 0018.6 10H15l1-4-1-1-5 5H7"/>
          </svg>
        )
    }
  }

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16 _feed_inner_area">
      {showLikers && <LikersModal likers={likers} title="People who liked this post" onClose={() => setShowLikers(false)} />}

      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        {/* Post header */}
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src="/assets/images/profile-1.png" alt="Image" className="_post_img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{post.author.full_name}</h4>
              <p className="_feed_inner_timeline_post_box_para" style={{ fontSize: '13px', margin: 0 }}>
                {format(post.created_at)} ·{' '}
                <a href="#0">{post.visibility === 'private' ? 'Private' : 'Public'}</a>
              </p>
            </div>
          </div>

          <div className="_feed_timeline_post_dropdown" style={{ position: 'relative' }}>
             <button className="_feed_timeline_post_dropdown_link" onClick={() => setDropOpen(!dropOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
             </button>
              <div className={`_feed_timeline_dropdown _timeline_dropdown${dropOpen ? ' show' : ''}`} style={{ display: dropOpen ? 'block' : 'none', right: 0 }}>
                <ul className="_feed_timeline_dropdown_list">
                  <li className="_feed_timeline_dropdown_item">
                    <button className="_feed_timeline_dropdown_link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => setDropOpen(false)}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z"/>
                        </svg>															  
                      </span>
                      Save Post
                    </button>
                  </li>
                  <li className="_feed_timeline_dropdown_item">
                    <button className="_feed_timeline_dropdown_link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => setDropOpen(false)}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                          <path fill="#377DFF" fillRule="evenodd" d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z" clipRule="evenodd"/>
                        </svg>										
                      </span>
                      Turn On Notification
                    </button>
                  </li>
                  {isOwner && (
                    <>
                      <li className="_feed_timeline_dropdown_item">
                        <button className="_feed_timeline_dropdown_link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => { setEditing(true); setDropOpen(false) }}>
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                              <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M8.25 3H3a1.5 1.5 0 00-1.5 1.5V15A1.5 1.5 0 003 16.5h10.5A1.5 1.5 0 0015 15V9.75"/>
                              <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13.875 1.875a1.591 1.591 0 112.25 2.25L9 11.25 6 12l.75-3 7.125-7.125z"/>
                            </svg>									
                          </span>
                          Edit Post
                        </button>
                      </li>
                      <li className="_feed_timeline_dropdown_item">
                        <button className="_feed_timeline_dropdown_link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: '#ff4d4f' }} onClick={() => { handleDelete() }}>
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                              <path stroke="#ff4d4f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5"/>
                            </svg>										
                          </span>
                          Delete Post
                        </button>
                      </li>
                    </>
                  )}
                  <li className="_feed_timeline_dropdown_item">
                    <button className="_feed_timeline_dropdown_link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => setDropOpen(false)}>
                      Report Post
                    </button>
                  </li>
                </ul>
              </div>
          </div>
        </div>

        {/* Edit mode or Content */}
        {editing ? (
          <div style={{ marginBottom: 16 }}>
            <textarea
              className="_textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="_visibility_select" value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <button className="_feed_inner_text_area_btn_link" onClick={handleEdit} disabled={editLoading} style={{ padding: '6px 14px', fontSize: 13 }}>
                {editLoading ? 'Saving...' : 'Save'}
              </button>
              <button className="_right_info_btn_link" onClick={() => setEditing(false)} style={{ padding: '6px 14px', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
            {post.image && (
              <div className="_feed_inner_timeline_image" style={{ margin: '0 -24px 12px' }}>
                <img
                  src={post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`}
                  alt="Post"
                  className="_time_img"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Reactions Bar */}
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image" onClick={handleShowLikers} style={{ cursor: 'pointer' }}>
          <img src="/assets/images/react_img1.png" alt="Image" className="_react_img1" />
          <img src="/assets/images/react_img2.png" alt="Image" className="_react_img" />
          <p className="_feed_inner_timeline_total_reacts_para">{post.like_count > 0 ? post.like_count : '0'}+</p>
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1" onClick={() => setShowComments(!showComments)} style={{ cursor: 'pointer' }}>
            <span>{post.comment_count}</span> Comment
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2"><span>0</span> Share</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="_feed_inner_timeline_reaction">
        <div 
          className="_reaction_btn_container"
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
          style={{ position: 'relative' }}
        >
          {showPicker && <ReactionPicker onSelect={(type) => handleLike(type)} />}
          
          <button 
            className={`_feed_reaction${post.is_liked ? ' _feed_reaction_active' : ''}`}
            onClick={() => handleLike()}
          >
            <span className="_feed_inner_timeline_reaction_link">
              <span>
                {getReactionIcon(post.reaction_type, post.is_liked)}
                {post.reaction_type ? (post.reaction_type.charAt(0).toUpperCase() + post.reaction_type.slice(1)) : 'Like'}
              </span>
            </span>
          </button>
        </div>

        <button className="_feed_reaction" onClick={() => setShowComments(!showComments)}>
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#666" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                <path stroke="#666" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
              </svg>
              Comment
            </span>
          </span>
        </button>

        <button className="_feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#666" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  )
}
