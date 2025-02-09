'use dom';

import { useEffect, useState } from 'react';

// 在 DOM Component 中，需要手动再引入一次全局样式才能使用 Tailwind CSS
import '@/global.css';

interface ContributorData {
  name: string;
  avatar: string;
  url: string;
  contributions: number;
}

async function fetchData(repo: string): Promise<ContributorData[]> {
  // TODO: 使用后端服务器缓存，解决网络不畅以及请求次数过多被限制的问题
  return await fetch(`https://api.github.com/repos/${repo}/contributors?per_page=100`)
    .then(res => res.json())
    .then((contributors: any) =>
      contributors
        .map(
          (contributor: any) =>
            ({
              name: contributor.login,
              avatar: contributor.avatar_url,
              url: contributor.html_url,
              contributions: contributor.contributions,
            }) as ContributorData,
        )
        .filter((contributor: ContributorData) => !contributor.name.endsWith('[bot]')),
    );
}

function ContributorContainer({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-row flex-wrap gap-2">{children}</div>;
}

function Contributor({ contributor }: { contributor: ContributorData }) {
  return (
    <a
      href={contributor.url}
      className="flex w-[108px] flex-col items-center justify-start overflow-hidden break-all rounded bg-card px-2 py-4 text-center text-card-foreground no-underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={contributor.avatar} alt={contributor.name} width={64} height={64} className="rounded-full" />
      <span className="mt-4 font-bold">{contributor.name}</span>
      {/* 这个还是先不显示了，不能准确反映贡献情况 */}
      {/*
      <span className="mt-2 text-xs">
        {contributor.contributions} contribution{contributor.contributions > 1 ? 's' : ''}
      </span>
      */}
    </a>
  );
}

export default function Contributors() {
  const [appContributors, setAppContributors] = useState<ContributorData[]>([]);
  const [serverContributors, setServerContributors] = useState<ContributorData[]>([]);
  const [jwchLibContributors, setJwchLibContributors] = useState<ContributorData[]>([]);
  const [yjsyLibContributors, setYjsyLibContributors] = useState<ContributorData[]>([]);

  useEffect(() => {
    fetchData('west2-online/fzuhelper-app').then(setAppContributors).catch(console.error);
    fetchData('west2-online/fzuhelper-server').then(setServerContributors).catch(console.error);
    fetchData('west2-online/jwch').then(setJwchLibContributors).catch(console.error);
    fetchData('west2-online/yjsy').then(setYjsyLibContributors).catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <section>
        <h2 className="mb-4 mt-6 text-2xl font-bold">客户端</h2>

        <ContributorContainer>
          {appContributors.length
            ? appContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>

      <section>
        <h2 className="mb-4 mt-6 text-2xl font-bold">服务端</h2>

        <ContributorContainer>
          {serverContributors.length
            ? serverContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>

      <section>
        <h2 className="mb-4 mt-6 text-2xl font-bold">本科教学管理系统对接</h2>

        <ContributorContainer>
          {jwchLibContributors.length
            ? jwchLibContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>

      <section>
        <h2 className="mb-4 mt-6 text-2xl font-bold">研究生教育管理信息系统对接</h2>

        <ContributorContainer>
          {yjsyLibContributors.length
            ? yjsyLibContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>
    </div>
  );
}
