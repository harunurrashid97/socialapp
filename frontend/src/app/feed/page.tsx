'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { postsApi } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import LeftSidebar from '@/components/layout/LeftSidebar'
import RightSidebar from '@/components/layout/RightSidebar'
import Stories from '@/components/posts/Stories'
import PostCreate from '@/components/posts/PostCreate'
import PostCard from '@/components/posts/PostCard'

interface Author { id: string; full_name: string; email: string }
interface Post {
  id: string; content: string; image: string | null; visibility: string
  like_count: number; comment_count: number; is_liked: boolean
  reaction_type: any | null
  created_at: string; author: Author
}

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await postsApi.list()
      setPosts(data.results || data)
      setNextCursor(data.next ? new URL(data.next).searchParams.get('cursor') : null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchPosts()
  }, [user, fetchPosts])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const { data } = await postsApi.list(nextCursor)
      setPosts(prev => [...prev, ...(data.results || data)])
      setNextCursor(data.next ? new URL(data.next).searchParams.get('cursor') : null)
    } catch {}
    finally { setLoadingMore(false) }
  }

  const handlePostCreated = () => fetchPosts()
  const handlePostDeleted = (id: string) => setPosts(prev => prev.filter(p => p.id !== id))
  const handlePostUpdated = (updated: Post) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))

  if (authLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f5' }}>
        <div className="_loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="_main_layout">
      <Navbar />

      <div className="container _custom_container">
        <div className="_layout_inner_wrap">
           <div className="row">
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                 <LeftSidebar />
              </div>
              
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                 <div className="_layout_middle_wrap">
                    <div className="_layout_middle_inner">
                       {/* Stories */}
                       <Stories />

                       {/* Create post */}
                       <PostCreate onPostCreated={handlePostCreated} />

                       {/* Posts list */}
                       {loading ? (
                         <div className="_loading">Loading posts...</div>
                       ) : posts.length === 0 ? (
                         <div className="_empty _feed_inner_area" style={{ padding: 40, textAlign: 'center' }}>
                           <p style={{ fontSize: 15 }}>No posts yet. Be the first to post!</p>
                         </div>
                       ) : (
                         <>
                           {posts.map((post) => (
                             <PostCard 
                               key={post.id} 
                               post={post} 
                               onDeleted={handlePostDeleted} 
                               onUpdated={handlePostUpdated} 
                             />
                           ))}
                           
                           {nextCursor && (
                             <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
                               <button 
                                 className="_right_info_btn_link _right_info_btn_link_active" 
                                 onClick={loadMore} 
                                 disabled={loadingMore}
                                 style={{ width: 'auto', padding: '10px 30px' }}
                               >
                                 {loadingMore ? 'Loading...' : 'Load More Posts'}
                               </button>
                             </div>
                           )}
                         </>
                       )}
                    </div>
                 </div>
              </div>

              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                 <RightSidebar />
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
