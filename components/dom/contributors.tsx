/* eslint-disable react-native/no-inline-styles */

'use dom';

import { useEffect, useState } from 'react';

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
  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' }}>{children}</div>
  );
}

function Contributor({ contributor }: { contributor: ContributorData }) {
  return (
    <a
      href={contributor.url}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderRadius: 4,
        padding: '8px 16px',
        overflow: 'hidden',
        textDecoration: 'none',
        textAlign: 'center',
        width: 90,
        color: '#333',
      }}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src={contributor.avatar}
        alt={contributor.name}
        width={64}
        height={64}
        style={{
          borderRadius: '50%',
        }}
      />
      <span
        style={{
          marginTop: 12,
          fontWeight: 'bold',
        }}
      >
        {contributor.name}
      </span>
      {/* 这个还是先不显示了，不能准确反映贡献情况 */}
      {/*
      <span
        style={{
          fontSize: 11,
          marginTop: 8,
        }}
      >
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
    <div style={{ padding: 12 }}>
      <h1>贡献者列表</h1>

      <section>
        <h2>客户端</h2>

        <ContributorContainer>
          {appContributors.length
            ? appContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>

      <section>
        <h2>服务端</h2>

        <ContributorContainer>
          {serverContributors.length
            ? serverContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>

      <section>
        <h2>本科教学管理系统对接</h2>

        <ContributorContainer>
          {jwchLibContributors.length
            ? jwchLibContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>

      <section>
        <h2>研究生教育管理信息系统对接</h2>

        <ContributorContainer>
          {yjsyLibContributors.length
            ? yjsyLibContributors.map(contributor => <Contributor key={contributor.name} contributor={contributor} />)
            : 'Loading...'}
        </ContributorContainer>
      </section>
    </div>
  );
}
