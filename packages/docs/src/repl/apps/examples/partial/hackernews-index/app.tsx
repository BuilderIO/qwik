import { component$, useServerMount$, useStore, useStyles$ } from '@builder.io/qwik';
import HackerNewsCSS from './hacker-news.css';

export const HackerNews = component$(() => {
  useStyles$(HackerNewsCSS);
  const store = useStore({ data: null });

  useServerMount$(async () => {
    const response = await fetch('https://node-hnapi.herokuapp.com/news?page=0');
    store.data = await response.json();
  });

  return (
    <>
      <Nav />
      <Stories data={store.data} />
    </>
  );
});

export const Nav = component$(
  () => {
    return (
      <header class="header">
        <nav class="inner">
          <a href="/">
            <strong>HN</strong>
          </a>
          <a href="/?type=new">
            <strong>New</strong>
          </a>
          <a href="/?type=show">
            <strong>Show</strong>
          </a>
          <a href="/?type=ask">
            <strong>Ask</strong>
          </a>
          <a href="/?type=job">
            <strong>Jobs</strong>
          </a>
          <a
            class="github"
            href="http://github.com/builderio/qwikdev"
            target="_blank"
            rel="noreferrer"
          >
            Built with Qwik
          </a>
        </nav>
      </header>
    );
  },
  { tagName: 'nav' }
);

export const Stories = component$((props: { data: any }) => {
  const page = 1;
  const type = 'list';
  const stories = props.data;
  return (
    <div class="news-view">
      <div class="news-list-nav">
        {page > 1 ? (
          <a class="page-link" href={`/?type=${type}&page=${page - 1}`} aria-label="Previous Page">
            {'<'} prev
          </a>
        ) : (
          <span class="page-link disabled" aria-disabled="true">
            {'<'} prev
          </span>
        )}
        <span>page {page}</span>
        {stories && stories.length >= 29 ? (
          <a class="page-link" href={`/?type=${type}&page=${page + 1}`} aria-label="Next Page">
            more {'>'}
          </a>
        ) : (
          <span class="page-link disabled" aria-disabled="true">
            more {'>'}
          </span>
        )}
      </div>
      <main class="news-list">
        {stories && (
          <ul>
            {stories.map((story: IStory) => (
              <StoryPreview story={story} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
});

export const StoryPreview = component$((props: { story: IStory }) => {
  return (
    <li class="news-item">
      <span class="score">{props.story.points}</span>
      <span class="title">
        {props.story.url && !props.story.url.startsWith('item?id=') ? (
          <>
            <a href={props.story.url} target="_blank" rel="noreferrer">
              {props.story.title}
            </a>
            <span class="host"> ({props.story.domain})</span>
          </>
        ) : (
          <a href={`/item/${props.story.id}`}>{props.story.title}</a>
        )}
      </span>
      <br />
      <span class="meta">
        {props.story.type !== 'job' ? (
          <>
            by <a href={`/users/${props.story.user}`}>{props.story.user}</a> {props.story.time_ago}{' '}
            |{' '}
            <a href={`/stories/${props.story.id}`}>
              {props.story.comments_count ? `${props.story.comments_count} comments` : 'discuss'}
            </a>
          </>
        ) : (
          <a href={`/stories/${props.story.id}`}>{props.story.time_ago}</a>
        )}
      </span>
      {props.story.type !== 'link' && (
        <>
          {' '}
          <span class="label">{props.story.type}</span>
        </>
      )}
    </li>
  );
});

export interface IComment {
  id: string;
  user: string;
  time_ago: string;
  content: string;
  comments: IComment[];
}

export interface IStory {
  id: string;
  points: string;
  url: string;
  title: string;
  domain: string;
  type: string;
  time_ago: string;
  user: string;
  comments_count: number;
  comments: IComment[];
}
