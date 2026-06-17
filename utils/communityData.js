const seededPosts = [
  {
    id: 'feed_001',
    type: 'feed',
    author: { studentId: '20260002', name: '林小悦', avatar: '悦' },
    title: '',
    content: '图书馆四楼这周晚上人不算多，适合复习和赶作业。',
    images: [],
    tags: ['自习', '图书馆'],
    location: '图书馆',
    likes: ['20260001', '20260003'],
    comments: [
      {
        id: 'cmt_feed_001',
        author: { studentId: '20260001', name: '张学长', avatar: '张' },
        content: '晚上八点后更安静。',
        time: '2026-06-17 19:20',
        replies: []
      }
    ],
    createdAt: '2026-06-17 19:00',
    viewCount: 18
  },
  {
    id: 'feed_002',
    type: 'feed',
    author: { studentId: '20260004', name: '周同学', avatar: '周' },
    title: '求问打印店营业时间',
    content: '明天一早要交材料，谁知道校内打印店今晚几点关门？',
    images: [],
    tags: ['求助', '打印'],
    location: '教学楼北侧',
    likes: ['20260002'],
    comments: [
      {
        id: 'cmt_feed_002',
        author: { studentId: '20260005', name: '陈学姐', avatar: '陈' },
        content: '工作日通常到晚上九点，最好八点半前过去。',
        time: '2026-06-17 18:55',
        replies: []
      }
    ],
    createdAt: '2026-06-17 18:40',
    viewCount: 11
  },
  {
    id: 'market_001',
    type: 'marketplace',
    author: { studentId: '20260003', name: '陈同学', avatar: '陈' },
    title: '转让二手台灯',
    content: '宿舍用的小台灯，亮度正常，10 元可拿走。',
    images: [],
    tags: ['宿舍', '二手'],
    location: '第二食堂',
    price: '¥10',
    status: '在售',
    likes: [],
    comments: [],
    createdAt: '2026-06-17 18:30',
    viewCount: 7
  },
  {
    id: 'market_002',
    type: 'marketplace',
    author: { studentId: '20260006', name: '李同学', avatar: '李' },
    title: '出九成新计算器',
    content: '课程结束后闲置，功能正常，面交优先。',
    images: [],
    tags: ['学习用品', '二手'],
    location: '格致楼',
    price: '¥35',
    status: '可议价',
    likes: ['20260001'],
    comments: [
      {
        id: 'cmt_market_002',
        author: { studentId: '20260007', name: '王同学', avatar: '王' },
        content: '今晚还能看吗？',
        time: '2026-06-17 18:25',
        replies: []
      }
    ],
    createdAt: '2026-06-17 18:10',
    viewCount: 13
  }
];

module.exports = {
  seededPosts
};
