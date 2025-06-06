// 课表
export const FAQ_COURSE = [
  {
    question: '课表数据的准确性如何？',
    answer: '在线刷新获取到的成绩数据和教务处一致，您可以在设置页面查看上次刷新时间。',
  },
  {
    question: '为什么有的课程没有显示？',
    answer: '可能您的课程发生了重叠。我们在重叠课程的右上方显示一个角标。您可以点击后进行切换。',
  },
  {
    question: '为什么有些考场漏了？',
    answer: '课表中只显示拥有考试日期，以及具体考试时间，且考试日期在学期范围内的考场。',
  },
  {
    question: '我的课表已经很久没有刷新了',
    answer: '您可以在设置页面强制刷新',
  },
];

// 空教室
export const FAQ_EMPTY_ROOM = [
  {
    question: '列表里的教室都是空教室吗？',
    answer:
      '我们对空教室的定义是：由教务系统提供的、您选择的日期和时段中没有安排教学事件的教室。列表里都是符合该定义的教室哦。',
  },
  {
    question: '空教室数据准吗？',
    answer: '我们保证数据和教务处的数据一致。但教务系统本身可能存在数据不一致性，请以实际情况为准。',
  },
  {
    question: '这个人数是什么意思？',
    answer: '教室可容纳数量。不是剩余空位的意思哦。',
  },
  {
    question: '为什么有时候没有部分教学楼的信息？',
    answer: '教务系统没有提供这个教学楼的数据，或单日该教学楼没有空教室',
  },
];

// 考表
export const FAQ_EXAM_ROOM = [
  {
    question: '考场查询的准确性如何？',
    answer: '在线刷新获取到的成绩数据和教务处一致，但具体考场位置可能会由授课教师另行通知。',
  },
  {
    question: '为什么部分课程没有考场？',
    answer: '部分课程没有线下考试，或者授课教师没有录入。',
  },
  {
    question: '什么时候可以查看补考考场？',
    answer: '每学期开学前一周左右，教务处上的补考考场会全部更新。',
  },
  {
    question: '选修课挂科有补考吗？',
    answer: '选修课一般没有补考，具体以授课教师通知为准。',
  },
  {
    question: '校选课在哪里考试？',
    answer: '线下通常是最后一节课随堂考，线上请注意授课 APP 的通知，具体以授课教师通知为准。',
  },
];

// 课程成绩
export const FAQ_COURSE_GRADE = [
  {
    question: '单学期绩点的准确性如何？',
    answer: ['单学期绩点通过学期成绩应用一定的规则计算得到。由于计算规则复杂，我们不保证其准确性，数据仅供参考。'],
  },
  {
    question: 'APP 内的单学期绩点是如何计算的？',
    answer: [
      '我们根据',
      {
        text: '《福州大学本科生课程考核与成绩记载管理实施办法（暂行）》',
        url: 'https://jwch.fzu.edu.cn/info/1172/13460.htm',
      },
      '的规则进行计算，同时不统计校选课课程（自然科学与工程技术类、人文社会科学类、经济管理类、文学与艺术类、工程技术类、劳动教育类、创新创业类、通识选修任选）以及“任意选修”类课程。单学期绩点基于本专业成绩计算，不统计二专业课程。',
    ],
  },
  {
    question: '研究生为什么没有单学期绩点？',
    answer: ['研究生教务系统没有提供单学期绩点（GPA）数据，只有学分（Credit）数据。'],
  },
  {
    question: '成绩什么时候更新？',
    answer:
      '教务处每学期有两次成绩更新时间，分别为期末考试结束后、补考结束后。大部分课程都会在学期的最后一周更新完成，具体时间以教务处通知为准。',
  },
  {
    question: 'APP 内的成绩准确性如何？',
    answer: '在线刷新获取到的成绩数据和教务处一致，但课程成绩可能会随着时间推移而更新。',
  },
  {
    question: 'APP 提供的内容作为成绩单，会被认可吗？',
    answer:
      '不会。加盖教务处公章的成绩单方为有效，可在教务处成绩自助打印终端打印纸质成绩单，或在“校务行”微信小程序获取电子成绩单。',
  },
];

// 更多工具
export const FAQ_MORE = [
  {
    question: '',
    answer: [
      '1. 部分服务需要校内网络环境（FZU）或登录',
      {
        text: '学校VPN',
        url: 'https://vpn2.fzu.edu.cn/',
      },
    ],
  },
  {
    question: '',
    answer: '2. 更多功能均需要登录统一身份认证平台，如果提示登录异常，可以在我的-右上角设置中退出登录后重新尝试',
  },
  {
    question: '',
    answer: '3. App 仅提供跳转便利，不负责维护内容与功能，页面可能出现无法加载的情况',
  },
];

export const FAQ_MAP = [
  {
    name: '反馈调研问卷',
    data: [
      {
        question: '',
        answer: [
          {
            text: '点击填写',
            url: 'https://west2-online.feishu.cn/share/base/form/shrcnHquU1QfSP6nOUfG6S0HpYd',
          },
        ],
      },
    ],
  },
  {
    name: '课程表',
    data: FAQ_COURSE,
  },
  {
    name: '空教室',
    data: FAQ_EMPTY_ROOM,
  },
  {
    name: '考场查询',
    data: FAQ_EXAM_ROOM,
  },
  {
    name: '成绩查询',
    data: FAQ_COURSE_GRADE,
  },
  {
    name: '更多工具',
    data: FAQ_MORE,
  },
];
