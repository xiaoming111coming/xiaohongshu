const generateBtn = document.getElementById('generateBtn');
const topicInput = document.getElementById('topic');
const resultList = document.getElementById('resultList');
const message = document.getElementById('message');

const templates = [
  '我以为「{topic}」很简单，结果第 3 天就破防了',
  '做了 30 天「{topic}」，我终于明白普通人怎么翻盘',
  '别再盲目冲了！「{topic}」最容易踩的 5 个坑',
  '同样是「{topic}」，会做和不会做的人差距太大了',
  '如果重来一次，我会这样开始「{topic}」',
  '从焦虑到上头：我靠「{topic}」找回生活掌控感',
  '低成本试错：新手做「{topic}」的 7 天行动清单',
  '被问爆了：我是怎么靠「{topic}」慢慢变强的',
  '看起来很卷，其实「{topic}」可以很轻松',
  '真心建议：想认真做「{topic}」，先看这 10 条',
  '我把「{topic}」做成了可复制流程，效率直接翻倍',
  '劝你别硬扛：做「{topic}」最重要的是这件事',
  '以为是鸡汤，结果「{topic}」真的让我赚到第一桶金',
  '普通人也能上手的「{topic}」模板，直接抄作业',
  '用了这个方法，我做「{topic}」不再三天打鱼'
];

function generateTitles(topic) {
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10).map((item) => item.replace('{topic}', topic));
}

generateBtn.addEventListener('click', () => {
  const topic = topicInput.value.trim();

  resultList.innerHTML = '';
  message.textContent = '';

  if (!topic) {
    message.textContent = '请先输入一个主题';
    return;
  }

  const titles = generateTitles(topic);
  titles.forEach((title) => {
    const li = document.createElement('li');
    li.textContent = title;
    resultList.appendChild(li);
  });
});
