'use dom';

import type { CommonContributorResponse, CommonContributorResponse_Contributor as Contributor } from '@/types/backend';
import Loading from '@/components/dom/loading';
import { cn } from '@/lib/utils';
import type { ColorSchemeName } from 'react-native';

// 在 DOM Component 中，需要手动再引入一次全局样式才能使用 Tailwind CSS
import '@/global.css';

const ContributorTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="py-4 text-2xl font-bold text-foreground">{children}</h2>
);

const ContributorContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="grid grid-cols-1 gap-x-2 gap-y-4 pb-1 min-[240px]:grid-cols-2 min-[360px]:grid-cols-3">
    {children}
  </div>
);

interface ContributorItemProps {
  contributor: Contributor;
}

const ContributorItem: React.FC<ContributorItemProps> = ({ contributor }) => (
  <a
    href={contributor.url}
    className="flex w-full flex-col items-center justify-start overflow-hidden break-all rounded-lg border border-border bg-card px-2 py-4 text-center text-card-foreground no-underline shadow-sm"
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

interface ContributorsDOMComponentProps {
  data: CommonContributorResponse;
  colorScheme: ColorSchemeName;
}

export default function Contributors({ data, colorScheme }: ContributorsDOMComponentProps) {
  return (
    <div className={cn(colorScheme === 'dark' && 'dark')}>
      {data ? (
        <div className="bg-background px-4">
          <section>
            <ContributorTitle>客户端</ContributorTitle>

            <ContributorContainer>
              {data.fzuhelper_app.map(contributor => (
                <ContributorItem key={contributor.name} contributor={contributor} />
              ))}
            </ContributorContainer>
          </section>

          <section>
            <ContributorTitle>服务端</ContributorTitle>

            <ContributorContainer>
              {data.fzuhelper_server.map(contributor => (
                <ContributorItem key={contributor.name} contributor={contributor} />
              ))}
            </ContributorContainer>
          </section>

          <section>
            <ContributorTitle>本科教学管理系统（对接）</ContributorTitle>

            <ContributorContainer>
              {data.jwch.map(contributor => (
                <ContributorItem key={contributor.name} contributor={contributor} />
              ))}
            </ContributorContainer>
          </section>

          <section>
            <ContributorTitle>研究生教育管理信息系统（对接）</ContributorTitle>

            <ContributorContainer>
              {data.yjsy.map(contributor => (
                <ContributorItem key={contributor.name} contributor={contributor} />
              ))}
            </ContributorContainer>
          </section>
        </div>
      ) : (
        <div className="flex h-screen w-screen items-center justify-center">
          <Loading />
        </div>
      )}
    </div>
  );
}
