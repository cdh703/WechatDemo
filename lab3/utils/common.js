const openingImageRoot = '/images/中国海洋大学2026级研究生开学典礼举行'
const registrationImageRoot = '/images/中国海洋大学2026级研究生入学报到'
const csscVisitImageRoot = '/images/中国船舶集团有限公司董事长、党组书记徐鹏来校调研'
const aerospaceVisitImageRoot = '/images/山东航天电子技术研究所来校调研'

// Local mock data shared by the index and detail pages.
const news = [
  {
    id: 'ouc-2026-aerospace-institute-visit',
    category: '合作交流',
    title: '山东航天电子技术研究所来校调研',
    keywords: ['山东航天', '航天电子', '研究所', '来校调研', '校所合作', '协同创新', '航天科技', '海洋科技', '人才培养', '科技攻关', '成果转化', '李林', '李明'],
    author: '赵奚赟',
    source: '新闻中心',
    poster: `${aerospaceVisitImageRoot}/1.jpg`,
    content: '8月28日，山东航天电子技术研究所所长李林一行来校调研，学校党委书记李明陪同调研并座谈。',
    add_date: '2026-08-31',
    baseViews: 1260,
    blocks: [
      {
        id: 'aerospace-visit-block-1',
        image: `${aerospaceVisitImageRoot}/1.jpg`,
        caption: '航天电子与海洋科技协同创新专题视觉图',
        paragraphs: [
          {
            id: 'aerospace-visit-paragraph-1',
            lead: true,
            text: '8月28日，山东航天电子技术研究所所长李林一行来校调研，学校党委书记李明陪同调研并座谈。'
          },
          {
            id: 'aerospace-visit-paragraph-2',
            text: '李明对李林一行表示欢迎，并简要介绍了学校事业发展情况。他表示，山东航天电子技术研究所是我国航天事业的重要支撑力量，双方合作空间广阔。希望双方加强战略合作，在人才培养、科技攻关、成果转化等方面深化科教融汇，推动产学研深度融合，共同为强国建设和山东高质量发展作出新的更大贡献。'
          }
        ]
      },
      {
        id: 'aerospace-visit-block-2',
        paragraphs: [
          {
            id: 'aerospace-visit-paragraph-3',
            text: '李林介绍了山东航天电子技术研究所的建设发展情况。他表示，中国海洋大学科研实力雄厚，希望双方围绕航天科技与海洋科技的交叉领域，系统策划合作项目，深化多领域务实合作，共同服务国家重大战略需求。'
          },
          {
            id: 'aerospace-visit-paragraph-4',
            text: '座谈会上，双方围绕深化校所合作、推动协同创新等进行深入交流。会前，李林一行参观了学校海洋科技成果展厅和校史馆。'
          },
          {
            id: 'aerospace-visit-paragraph-5',
            text: '山东航天电子技术研究所党委书记张术鹏、副所长王永，学校党委常委、副校长李岩，双方有关单位负责人和专家参加活动。'
          }
        ]
      }
    ],
    credits: [
      '文：赵奚赟',
      '编辑：赵奚赟',
      '责任编辑：李华昌'
    ]
  },
  {
    id: 'ouc-2026-graduate-opening',
    category: '校园生活',
    title: '中国海洋大学2026级研究生开学典礼举行',
    keywords: ['开学', '开学典礼', '研究生', '新生', '奖学金', '科研', '人工智能', 'AI', 'AI科研', '崂山校区', '入学教育', '张峻峰', '李明'],
    author: '金松',
    source: '新闻中心',
    poster: `${openingImageRoot}/1.jpg`,
    content: '海纳新知，逐梦启航。8月24日，中国海洋大学2026级研究生开学典礼在崂山校区综合体育馆举行。',
    add_date: '2026-08-24',
    baseViews: 2860,
    blocks: [
      {
        id: 'block-1',
        image: `${openingImageRoot}/1.jpg`,
        paragraphs: [
          {
            id: 'paragraph-1',
            lead: true,
            text: '海纳新知，逐梦启航。8月24日，中国海洋大学2026级研究生开学典礼在崂山校区综合体育馆举行。党委书记李明，党委副书记、校长张峻峰，党委副书记范其伟，党委常委、副校长林旭升，党委副书记、纪委书记俞黎阳，党委副书记蒋秋飚，党委常委、副校长李岩出席。党委常委、副校长王雪鹏主持。1134名博士研究生、5092名硕士研究生胸怀蓝色梦想，跨越五湖四海，齐聚海大园，开启新征程。'
          }
        ]
      },
      {
        id: 'block-2',
        image: `${openingImageRoot}/2.jpg`,
        paragraphs: [
          {
            id: 'paragraph-2',
            text: '李明为研究生卓越奖学金获得者颁发荣誉证书。范其伟宣读了《关于颁发2026年中国海洋大学研究生卓越奖学金的决定》。2023级物理海洋学专业博士研究生谢春虎，2022级水生生物学专业博士研究生赖文聪，2022级食品科学与工程专业博士研究生陈广宁，2022级港口、海岸及近海工程专业博士研究生曾昕萌受到表彰。'
          }
        ]
      },
      {
        id: 'block-3',
        image: `${openingImageRoot}/3.jpg`,
        paragraphs: [
          {
            id: 'paragraph-3',
            text: '张峻峰代表学校对新同学表示欢迎。他指出，研究生阶段是职业发展的起点，要更加明确学习目标、奋斗志向，清楚为谁学习、为谁科研；要更加深耕专业方向、注重科研训练，锤炼科学素养、提升逻辑思维；要更加自主自觉，从“学会”转向“学问”和“研究”，敢于提出好问题、善于解决真问题，努力在前人止步的地方创造新知识。'
          },
          {
            id: 'paragraph-4',
            text: '张峻峰指出，身处世界之变、时代之变、历史之变加速演进的当下，人工智能正在深刻重塑人类的学习方式、认知方式和科研范式。对于如何在AI时代做好研究生阶段的学习与科研，他寄语学生，要正确认识人工与智能的关系，以人机协同契合科研时代性，在人机良性互动中探索符合新时代研究规律和自身特点的最佳路径；要正确认识学术与技术的关系，以扎实学识守牢科研主体性，搭建属于自己的系统化、精细化知识架构；要正确认识继承与开创的关系，以原创思维提升科研创新性，持续锤炼创新思维、精进创新能力；要正确认识效率与质量的关系，以求实精神涵养科研严谨性，坚持长期主义，恪守科研规范，严守学术诚信。他希望同学们立科研报国大志向，把个人学术追求融入强国建设、民族复兴的时代大局，努力成长为胸怀蓝色梦想、堪当时代重任的栋梁之才。'
          }
        ]
      },
      {
        id: 'block-4',
        image: `${openingImageRoot}/4.jpg`,
        paragraphs: [
          {
            id: 'paragraph-5',
            text: '研究生指导教师代表、材料科学与工程学院副院长刘爽希望同学们完成从“知识观光者”到“前沿探路人”的角色转变，在师生同行的学术航程中拓宽人生格局，将个人学术追求融入海洋强国建设的时代使命之中。'
          },
          {
            id: 'paragraph-6',
            text: '在校研究生代表、2024级港口、海岸及近海工程专业博士研究生高力元结合自身科研体会分享感悟，祝愿新同学向深处扎根、向实处求索、向远处奔赴，书写无愧于时代的青春答卷。'
          },
          {
            id: 'paragraph-7',
            text: '新生代表、食品科学与工程专业2026级博士研究生李梦晓期待与大家携手同行，在包容与温暖的海大校园中，将个人小课题接上时代大命题，以奋斗之姿共赴蓝色梦想。'
          }
        ]
      },
      {
        id: 'block-5',
        image: `${openingImageRoot}/5.jpg`,
        paragraphs: [
          {
            id: 'paragraph-8',
            text: '开学典礼在鱼山校区及三亚海洋研究院设分会场。机关各部处主要负责人，学部、各学院（中心）主要负责人、分管学生工作负责人、分管研究生工作负责人、研究生导师代表、团委书记，以及2026级全体研究生参加典礼。'
          }
        ]
      },
      {
        id: 'block-6',
        image: `${openingImageRoot}/6.jpg`,
        paragraphs: [
          {
            id: 'paragraph-9',
            text: '典礼结束后，学校举行了入学教育活动，党委常委、统战部部长陈鷟作题为《浩海求索是 谋海济国功——中国海大故事》的专题报告。研究生院常务副院长陈朝晖主持活动。'
          }
        ]
      }
    ],
    credits: [
      '文：金松　图：赵奚赟 袁艺 王红梅',
      '编辑：李华昌',
      '责任编辑：李华昌'
    ]
  },
  {
    id: 'ouc-2026-graduate-registration',
    category: '校园生活',
    kicker: '乘风向海 展新篇章',
    title: '中国海洋大学2026级研究生入学报到',
    keywords: ['迎新', '报到', '新生报到', '研究生', '志愿者', '宿舍', '照片采集', '崂山校区', '鱼山校区', '校园生活'],
    author: '通讯员',
    source: '学生工作处 新闻中心',
    poster: `${registrationImageRoot}/1.jpg`,
    content: '8月23日，中国海洋大学校园里处处洋溢着崭新的朝气，2026级研究生新生迎新工作如期开展。',
    add_date: '2026-08-24',
    baseViews: 2140,
    blocks: [
      {
        id: 'registration-block-0',
        paragraphs: [
          {
            id: 'registration-paragraph-1',
            lead: true,
            text: '8月23日，中国海洋大学校园里处处洋溢着崭新的朝气，2026级研究生新生迎新工作如期开展。怀揣求知热忱与学术理想的莘莘学子从祖国各地汇聚于此，即将在海大园开启属于自己的逐梦之旅。'
          },
          {
            id: 'registration-paragraph-2',
            text: '学校党委书记李明，校长张峻峰，副校长林旭升、王雪鹏与相关单位负责人分别来到迎新现场，欢迎来校报到的研究生新生，慰问参与迎新工作的师生员工。'
          }
        ]
      },
      {
        id: 'registration-block-1',
        image: `${registrationImageRoot}/1.jpg`,
        paragraphs: [
          {
            id: 'registration-paragraph-3',
            text: '李明首先来到海洋地球科学学院、环境科学与工程学院迎新报到点，了解新生注册报到流程。在崂山校区西门党员先锋服务岗和第一食堂，李明了解了迎新志愿服务、校园治安及警校联动工作和餐饮保障情况。在北海苑学生宿舍，李明查看了研究生住宿条件，关心询问新生的学习规划和生活情况。'
          }
        ]
      },
      {
        id: 'registration-block-2',
        image: `${registrationImageRoot}/2.jpg`,
        paragraphs: [
          {
            id: 'registration-paragraph-4',
            text: '张峻峰先后来到南海苑学生宿舍、崂山校区南门党员先锋服务岗、管理学院和经济学院实地检查迎接新生报到工作，了解新生注册与信息采集流程，关心新生学习生活服务保障情况，与入住新生及家长亲切交流。'
          },
          {
            id: 'registration-paragraph-5',
            text: '迎新现场，工作人员与志愿者各司其职、全程在岗，为新生报到提供全链条服务保障。'
          },
          {
            id: 'registration-paragraph-6',
            text: '当“海大人”的身份正式落定，2026级研究生新生们纷纷畅谈心声，分享了对研究生新阶段的期待与规划。药学专业硕士研究生张译文说：“终于踏入美丽的海大校园，报到过程很温暖，老师亲切热忱，学长学姐热心引路、帮忙搬运行李，他们的热情消解了我初来乍到的紧张。期待能够紧跟师长脚步，在实验中探索求知，潜心钻研，踏实前行。”中国史专业硕士研究生王庆盛说：“报到当天，领导老师们来到宿舍与我们面对面交流，让我真切感受到了海大大家庭的温暖，也让我对即将开启的研究生生活充满信心与期待。我将时刻铭记师长嘱托，在科研上做敢为人先的探索者，以实际行动回馈学校的关怀。”新一代电子信息技术（含量子技术等）专业硕士研究生汤瀚海说：“研究生阶段代表着更高的标准与更大的挑战。未来三年我将脚踏实地深耕专业领域，博采众长，沉心深耕科研、笃实勤学。把握难得的求学机遇，步履不停，交出一份不负韶华、无愧于心的研究生答卷。”捕捞学专业博士研究生宋亚彩说：“从本科、硕士一路走来，鱼山校园见证了我大学七年的成长。站在博士阶段的全新起点，我将不忘初心、脚踏实地，不畏科研中的重重未知，深耕海洋领域，以所学回馈家国，在这片沃土开启属于自己的崭新征程。”'
          }
        ]
      },
      {
        id: 'registration-block-3',
        image: `${registrationImageRoot}/3.jpg`,
        caption: '新生照片采集',
        paragraphs: []
      },
      {
        id: 'registration-block-4',
        image: `${registrationImageRoot}/4.jpg`,
        caption: '现场报到确认',
        paragraphs: []
      },
      {
        id: 'registration-block-5',
        image: `${registrationImageRoot}/5.jpg`,
        caption: '志愿者为新生指路',
        paragraphs: []
      }
    ],
    credits: [
      '图：袁艺 赵奚赟 刘莅 白金楠 海洋生命学院',
      '整理：高缘 周鹏 张慧',
      '编辑：赵奚赟',
      '责任编辑：李华昌'
    ]
  },
  {
    id: 'ouc-2026-cssc-visit',
    category: '合作交流',
    title: '中国船舶集团有限公司董事长、党组书记徐鹏来校调研',
    keywords: ['中船集团', '中国船舶', '校企合作', '调研', '深海装备', '极地装备', '智能船舶', '海上风电', '科技创新', '徐鹏', '海洋强国'],
    author: '周文燕',
    source: '新闻中心',
    poster: `${csscVisitImageRoot}/1.jpg`,
    content: '8月27日，中国船舶集团有限公司董事长、党组书记徐鹏来校调研。学校党委书记李明陪同调研并座谈。',
    add_date: '2026-08-28',
    baseViews: 1680,
    blocks: [
      {
        id: 'cssc-visit-block-1',
        image: `${csscVisitImageRoot}/1.jpg`,
        paragraphs: [
          {
            id: 'cssc-visit-paragraph-1',
            lead: true,
            text: '8月27日，中国船舶集团有限公司董事长、党组书记徐鹏来校调研。学校党委书记李明陪同调研并座谈。'
          }
        ]
      },
      {
        id: 'cssc-visit-block-2',
        image: `${csscVisitImageRoot}/2.jpg`,
        paragraphs: [
          {
            id: 'cssc-visit-paragraph-2',
            text: '李明对徐鹏一行表示欢迎。他表示，中国船舶集团是全球最大的造船集团，是我国船舶工业发展的主力军。学校正全面贯彻落实习近平总书记给学校全体师生的重要回信精神，大力推进科技创新与产业创新深度融合。期待双方加强全方位战略合作，在深海、极地装备、智能船舶等领域开展原创性引领性协同创新，大力推进人才共育、平台共建、项目共担、资源共享、互利共赢，共同为海洋经济高质量发展、为强国建设作出更大贡献。'
          }
        ]
      },
      {
        id: 'cssc-visit-block-3',
        image: `${csscVisitImageRoot}/3.jpg`,
        paragraphs: [
          {
            id: 'cssc-visit-paragraph-3',
            text: '徐鹏介绍了中国船舶集团的发展情况。他表示，双方在深海装备、极地装备、海上风电等方面合作空间巨大。中船集团将与中国海洋大学携手并进，系统策划重大项目，加速科技成果产业化，共同为海洋强国建设贡献力量。'
          },
          {
            id: 'cssc-visit-paragraph-4',
            text: '座谈会上，双方围绕深化校企合作、推动海洋科技协同创新等进行深入交流。会前，徐鹏一行参观了海洋科技成果展厅。'
          },
          {
            id: 'cssc-visit-paragraph-5',
            text: '中船集团党组成员、副总经理彭原璞，学校党委常委、副校长王厚杰，双方有关单位负责人参加活动。'
          }
        ]
      }
    ],
    credits: [
      '文/图：周文燕',
      '编辑：赵奚赟',
      '责任编辑：李华昌'
    ]
  }
]

function getNewsList() {
  return news
    .map((article) => {
      const bodyText = article.blocks
        .reduce((texts, block) => {
          if (block.caption) texts.push(block.caption)
          block.paragraphs.forEach((paragraph) => texts.push(paragraph.text))
          return texts
        }, [])
        .join(' ')

      return {
        id: article.id,
        category: article.category,
        poster: article.poster,
        summary: article.content,
        add_date: article.add_date,
        title: article.title,
        author: article.author,
        source: article.source,
        keywords: article.keywords || [],
        searchText: bodyText,
        baseViews: article.baseViews
      }
    })
    .sort((a, b) => b.add_date.localeCompare(a.add_date))
}

function getRelatedNews(newsID, limit = 2) {
  return getNewsList()
    .filter((item) => item.id !== newsID)
    .slice(0, limit)
}

function getNewsDetail(newsID) {
  const article = news.find((item) => item.id === newsID)
  return {
    code: article ? '200' : '404',
    news: article || {}
  }
}

module.exports = {
  getNewsList,
  getNewsDetail,
  getRelatedNews
}
