import { get, post } from '@/modules/native-request';
import { Buffer } from 'buffer';
import { selectAll, selectOne } from 'css-select';
import { getAttributeValue } from 'domutils';
import { parseDocument } from 'htmlparser2';

const ONEKEY_COMMENT_PREFIX = 'https://jwcjwxt2.fzu.edu.cn:81';

const ONEKEY_COMMENT_URLS = {
  CAPTCHA: ONEKEY_COMMENT_PREFIX + '/student/jscp/ValidNums.aspx',
  TEACHER_LIST: ONEKEY_COMMENT_PREFIX + '/student/jscp/TeaList.aspx',
  COMMENT_TEACHER: ONEKEY_COMMENT_PREFIX + '/student/jscp/TeaEvaluation.aspx',
} as const;

function escapeQueryParams(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([k, v]) => `${k}=${escape(v)}`)
    .join('&');
}

interface ASPNET_Form {
  __VIEWSTATE: string;
  __VIEWSTATEGENERATOR: string;
  __EVENTVALIDATION: string;
}

interface CommentTeacherForm extends ASPNET_Form {
  ctl00$ContentPlaceHolder1$TB_zf: string;
  ctl00$ContentPlaceHolder1$TB_pj: string;
  ctl00$ContentPlaceHolder1$verifycode: string;
  ctl00$ContentPlaceHolder1$Button_xk: string;
}

export interface CourseInfo {
  courseName: string;
  teacherName: string;
  params: Record<string, string>;
}

export default class OnekeyComment {
  cookies: string = '';

  setCookies(newCookies: string) {
    // ASP.NET_SessionId=4nsgja45t4z0j4wzpx1rsmzb
    this.cookies = newCookies;
  }

  getCookies() {
    return this.cookies;
  }

  clearCookies() {
    this.cookies = '';
  }

  async get(url: string, headers: Record<string, string>) {
    const mergedHeaders = Object.assign({}, { Cookie: this.getCookies() }, headers);
    const { data } = await get(url, mergedHeaders);

    return data;
  }

  async post(url: string, headers: Record<string, string>, formData: Record<string, string>) {
    const mergedHeaders = Object.assign({}, { Cookie: this.getCookies() }, headers);
    const { data, headers: resHeaders } = await post(url, mergedHeaders, formData);

    return { data: data, headers: resHeaders };
  }

  async getCaptcha(): Promise<Uint8Array> {
    return await this.get(ONEKEY_COMMENT_URLS.CAPTCHA, {});
  }

  async getUncommentTeachers(id: string, type: 'xqxk' | 'score'): Promise<CourseInfo[]> {
    const reqParams = new URLSearchParams({ id, bj: type });
    const url = `${ONEKEY_COMMENT_URLS.TEACHER_LIST}?${reqParams}`;
    const resp = await this.get(url, {});
    const text = Buffer.from(resp).toString('utf-8');

    const dom = parseDocument(text);
    const anchors = selectAll('a[href^="TeaEvaluation.aspx"]', dom);

    const info: CourseInfo[] = [];

    for (const a of anchors) {
      const href = getAttributeValue(a as any, 'href');
      if (!href) continue;

      const fullUrl = new URL(href, ONEKEY_COMMENT_PREFIX + '/');
      const params = new URLSearchParams(fullUrl.search);
      const courseName = params.get('kcmc') || '';
      const teacherName = params.get('jsxm') || '';
      const paramsRecord = Object.fromEntries(params.entries());
      info.push({ courseName, teacherName, params: paramsRecord });
    }

    return info;
  }

  async getCommentForm(params: Record<string, string>): Promise<ASPNET_Form> {
    const url = `${ONEKEY_COMMENT_URLS.COMMENT_TEACHER}?${escapeQueryParams(params)}`;
    const resp = await this.get(url, {});
    const text = Buffer.from(resp).toString('utf-8');
    const dom = parseDocument(text);

    function getInputValueById(id: string): string {
      const input = selectOne(`#${id}`, dom);
      return (input && getAttributeValue(input as any, 'value')) || '';
    }

    return {
      __VIEWSTATE: getInputValueById('__VIEWSTATE'),
      __VIEWSTATEGENERATOR: getInputValueById('__VIEWSTATEGENERATOR'),
      __EVENTVALIDATION: getInputValueById('__EVENTVALIDATION'),
    };
  }

  async commentTeacher(params: Record<string, string>, score: string, comment: string, recaptcha: string) {
    const url = `${ONEKEY_COMMENT_URLS.COMMENT_TEACHER}?${escapeQueryParams(params)}`;
    const aspnetForm = await this.getCommentForm(params);
    const fullForm: CommentTeacherForm = {
      ...aspnetForm,
      ...{
        ctl00$ContentPlaceHolder1$TB_zf: score,
        ctl00$ContentPlaceHolder1$TB_pj: comment,
        ctl00$ContentPlaceHolder1$verifycode: recaptcha,
        ctl00$ContentPlaceHolder1$Button_xk: '确定',
      },
    };

    await this.post(url, {}, { ...fullForm });
  }
}
