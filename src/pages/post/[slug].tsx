
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    subtitle: string;
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const postLength = post.data.content.reduce((acc, current) => {
    return acc += RichText.asText(current.body).split(' ').concat(current.heading.split(' ')).length;
  }, 0)

  const time = Math.ceil(postLength / 200);

  return (
    <div className={styles.container}>
      <div className={styles.bannerContainer}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <main className={styles.mainContainer}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.postInfo}>
            <FiCalendar />
            <time>{format(
              new Date(post.first_publication_date),
              "dd MMM yyyy",
              {
                locale: ptBR,
              }
            )}</time>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{time} min</span>
          </div>
        </div>
        {post.data.content.map(item => (
          <article
            className={styles.postContent}
            key={item.heading}
          >
            <h2>{item.heading}</h2>
            <div
              dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body) }}
            />
          </article>
        ))}
      </main>
    </div >

  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  ).then(response => response.results);

  const paths = posts.map(post => ({
    params: { slug: post.uid }
  }))

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('post', slug, {});

  const post: Post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content
    }
  }
  return {
    props: {
      post,
    }
  }
};
