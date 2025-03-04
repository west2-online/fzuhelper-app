'use dom';

import { useEffect, useState } from 'react';

import type { CommonContributorResponse, CommonContributorResponse_Contributor as Contributor } from '@/api/backend';
import { getApiV1CommonContributor } from '@/api/generate';

import Loading from '@/components/dom/loading';

// 在 DOM Component 中，需要手动再引入一次全局样式才能使用 Tailwind CSS
import '@/global.css';

const ContributorTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="mb-4 mt-6 text-2xl font-bold">{children}</h2>
);

const ContributorContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="grid grid-cols-1 gap-x-2 gap-y-4 min-[240px]:grid-cols-2 min-[360px]:grid-cols-3">{children}</div>
);

interface ContributorItemProps {
  contributor: Contributor;
}

const ContributorItem: React.FC<ContributorItemProps> = ({ contributor }) => (
  <a
    href={contributor.url}
    className="flex w-[120px] flex-col items-center justify-start overflow-hidden break-all rounded bg-card px-2 py-4 text-center text-card-foreground no-underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src={contributor.avatar_url} alt={contributor.name} width={64} height={64} className="rounded-full" />
    <span className="mt-4 font-bold">{contributor.name}</span>
    {/* 这个还是先不显示了，不能准确反映贡献情况 */}
    {/*
      <span className="mt-2 text-xs">
        {contributor.contributions} contribution{contributor.contributions > 1 ? 's' : ''}
      </span>
      */}
  </a>
);

export default function Contributors() {
  const [response, setResponse] = useState<CommonContributorResponse | null>(null);

  useEffect(() => {
    getApiV1CommonContributor().then(res => setResponse(res.data.data));
  }, []);

  return response ? (
    <div className="p-4">
      <section>
        <ContributorTitle>客户端</ContributorTitle>

        <ContributorContainer>
          {response.fzuhelper_app.map(contributor => (
            <ContributorItem key={contributor.name} contributor={contributor} />
          ))}
        </ContributorContainer>
      </section>

      <section>
        <ContributorTitle>服务端</ContributorTitle>

        <ContributorContainer>
          {response.fzuhelper_server.map(contributor => (
            <ContributorItem key={contributor.name} contributor={contributor} />
          ))}
        </ContributorContainer>
      </section>

      <section>
        <ContributorTitle>本科教学管理系统对接</ContributorTitle>

        <ContributorContainer>
          {response.jwch.map(contributor => (
            <ContributorItem key={contributor.name} contributor={contributor} />
          ))}
        </ContributorContainer>
      </section>

      <section>
        <ContributorTitle>研究生教育管理信息系统对接</ContributorTitle>

        <ContributorContainer>
          {response.yjsy.map(contributor => (
            <ContributorItem key={contributor.name} contributor={contributor} />
          ))}
        </ContributorContainer>
      </section>
    </div>
  ) : (
    <div className="flex h-screen w-full items-center justify-center">
      <Loading />
    </div>
  );
}
