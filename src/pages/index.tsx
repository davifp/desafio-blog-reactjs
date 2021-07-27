import { render } from '@testing-library/react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results)


  async function handleLoadMorePost() {
    const data = await fetch(nextPage)
      .then(response => response.json())
      .then(data => data);

    setNextPage(data.next_page)
    setPosts([...posts, ...data.results])
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.postInfo}>
                  <FiCalendar size={20} />
                  <time>{
                    format(
                      new Date(post.first_publication_date),
                      "dd MMM yyyy",
                      {
                        locale: ptBR,
                      }
                    )
                  }</time>
                  <FiUser size={20} />
                  <span className='author'>{post.data.author}</span>
                </div>
              </a>
            </Link>

          ))}
          {nextPage &&
            <button
              type="button"
              className='styles.loadPostsButton'
              onClick={() => handleLoadMorePost()}
            >
              Carregar mais posts
            </button>
          }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'), { pageSize: 1 }
  );

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map(post => {
    console.log(post);
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      },
    }
  })

  return {
    props: {
      postsPagination: {
        results,
        next_page
      }
    }
  };
};
