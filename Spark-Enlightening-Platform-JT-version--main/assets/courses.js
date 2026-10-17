/* ============================================================
 * 课程数据（共享）
 * 由 index.html（课程列表）与 course.html（课程详情）共同读取，
 * 避免同一份数据在两处各写一遍、日后不同步。
 * ============================================================ */
var COURSES = [
  {id:1, title:"人工智能数据识别原理入门",     type:"data",  tag:"数据读心术", img:"assets/course/1.webp"},
  {id:2, title:"生活数据采集与AI认知启蒙",     type:"data",  tag:"数据读心术", img:"assets/course/2.webp"},
  {id:3, title:"数字信息解码与逻辑基础讲解",   type:"data",  tag:"数据读心术", img:"assets/course/3.webp"},
  {id:4, title:"智能助手开发实战",             type:"inter", tag:"人机共舞术", img:"assets/course/4.webp"},
  {id:5, title:"对话系统设计",                 type:"inter", tag:"人机共舞术", img:"assets/course/5.webp"},
  {id:6, title:"提示词工程大师课",             type:"inter", tag:"人机共舞术", img:"assets/course/6.webp"},
  {id:7, title:"AI伦理与安全",                 type:"ethic", tag:"伦理守护盾", img:"assets/course/7.webp"},
  {id:8, title:"AIGC全栈应用",                 type:"cross", tag:"跨界编织者", img:"assets/course/8.webp"},
  {id:9, title:"多模态大模型实战",             type:"cross", tag:"跨界编织者", img:"assets/course/9.webp"},
  {id:10,title:"AI商业落地项目",               type:"cross", tag:"跨界编织者", img:"assets/course/10.webp"},
  {id:11,title:"数据安全与合规",               type:"ethic", tag:"伦理守护盾", img:"assets/course/11.webp"},
  {id:12,title:"AI风控系统",                   type:"ethic", tag:"伦理守护盾", img:"assets/course/12.webp"},
  {id:13,title:"图像语音数据智能分析科普",     type:"data",  tag:"数据读心术", img:"assets/course/13.webp"},
  {id:14,title:"大数据时代AI基础思维培养",     type:"data",  tag:"数据读心术", img:"assets/course/14.webp"},
  {id:15,title:"前端AI组件开发",               type:"inter", tag:"人机共舞术", img:"assets/course/15.webp"},
  {id:16,title:"语音交互系统",                 type:"inter", tag:"人机共舞术", img:"assets/course/16.webp"},
  {id:17,title:"AI绘画进阶",                   type:"cross", tag:"跨界编织者", img:"assets/course/17.webp"},
  {id:18,title:"AI视频生成",                   type:"cross", tag:"跨界编织者", img:"assets/course/18.webp"},
  {id:19,title:"乡村支教趣味AI数据通识课",     type:"data",  tag:"数据读心术", img:"assets/course/19.webp"},
  {id:20,title:"AI全栈项目实战",               type:"cross", tag:"跨界编织者", img:"assets/course/20.webp"}
];

/* 各分类的课程简介（详情页展示用） */
var COURSE_DESC = {
  data:  "本课程趣味讲解人工智能的数据底层逻辑，帮助学生理解 AI 如何识别与分析文字、图片、声音等数据，建立科学的数字思维。",
  inter: "本课程讲解人机交互与智能助手的工作方式，从对话系统设计到提示词技巧，帮助学生理解 AI 如何与人协作。",
  ethic: "本课程围绕 AI 安全、伦理规范与数据合规，帮助学生建立正确的技术价值观与风险防范意识。",
  cross: "本课程展示 AI 在图像、视频、商业等多领域的综合应用，帮助学生理解人工智能如何与各行业融合创新。"
};

/* 各分类对应的教学视频
 * 原来详情页无论点哪门课都播放同一段「数据读心者.mp4」，
 * 而 assets/videos/ 里另外 3 段视频（人机舞蹈家/伦理守望者/跨界编织者）
 * 从未被任何页面引用。这里按分类绑定，正好一一对应。 */
var COURSE_VIDEO = {
  data:  "assets/videos/数据读心者.mp4",
  inter: "assets/videos/人机舞蹈家.mp4",
  ethic: "assets/videos/伦理守望者.mp4",
  cross: "assets/videos/跨界编织者.mp4"
};

/* 给每门课补上简介与视频 */
COURSES.forEach(function (c) {
  c.desc  = COURSE_DESC[c.type]  || COURSE_DESC.data;
  c.video = COURSE_VIDEO[c.type] || COURSE_VIDEO.data;
  c.poster = c.video.replace('assets/videos/', 'assets/posters/').replace('.mp4', '.webp');
});

/* 导出为全局变量，供其他脚本使用 */
window.COURSES = COURSES;
