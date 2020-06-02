const { ipcRenderer } = require('electron');
const { shell } = require('electron').remote;
let STORE_LIST = [];//保存已经选择的路径
let SUCCESS_COUNT = 0;
let COUNTALL = []; //总条数，用来算百分比
let PROGRESS = 0;  //缓存进度
let OUTPUT_PATH = null; //输出路径
let LOCK = false; //是否在解码中

//注册事件监听
function initFileEventListener() {
  let fileSelector = document.getElementById('file-selector'); //选择文件
  fileSelector.addEventListener('change', storeSongList);
  let fileSelector2 = document.getElementById('file-selector2'); //选择文件夹
  fileSelector2.addEventListener('change', storeSongList);
}

//注册4个按钮的事件
function initButtonEventListener() {
  //点击开始转换
  document.querySelector('.convert').addEventListener('click', function () {
    if (!STORE_LIST.length) { return };
    ipcRenderer.send('fileList', { type: 'CONVERT', msg: STORE_LIST });
    LOCK = true;
  })
  //点击取消
  document.querySelector('.cancel').addEventListener('click', function () {
    if (!STORE_LIST.length) { return };
    ipcRenderer.send('fileList', { type: 'STOP', msg: '' });
  })
  //点击清空
  document.querySelector('.clear').addEventListener('click', function () {
    if (!STORE_LIST.length) { return };
    if (LOCK) {
      return;
    } else {
      document.querySelector('.filelist').innerHTML = '';
      STORE_LIST = [];
    }
  })
  //点击查看输出文件夹
  document.querySelector('.check').addEventListener('click', function () {
    if (!OUTPUT_PATH) { alert('还没转呢'); return };
    shell.showItemInFolder(OUTPUT_PATH);
  })
}

window.onload = function(){
  initFileEventListener();
  initButtonEventListener();
}

//保存缓存音乐的路径
function storeSongList(e) {
  let $frag = document.createDocumentFragment();
  let $list = document.querySelector('.filelist');
  Array.from(this.files).forEach((v, i) => {
    if (STORE_LIST.length >= 1000) { alert('一次只能选择1000条以内'); return };
    if (STORE_LIST.indexOf(v.path) > -1 || !/\.uc$/.test(v.path)) { return };
    if (!OUTPUT_PATH) { OUTPUT_PATH = v.path };
    STORE_LIST.push(v.path) //保存到已经选择路径列表
    let $li = document.createElement('li');
    $li.innerText = v.path;
    $li.className = 'filelist-item';
    $frag.append($li);
  })
  $list.append($frag);
  COUNTALL = STORE_LIST.length;
}

//收到主线程信息以后，动态更改待处理列表
ipcRenderer.on('fileList', function (event, data) {
  let $list = document.querySelector('.filelist');
  switch (data.type) {
    case 'INFO': {
      let idx = STORE_LIST.indexOf(data.msg);
      STORE_LIST.splice(idx, 1);
      SUCCESS_COUNT++;
      let $lists = document.querySelectorAll('.filelist-item');
      if ($lists[0]) {
        $list.removeChild($lists[0]);
        updateProgress();
      }
      break;
    }
    case 'WARN': {
      alert(data.msg);
      LOCK = false;
      break;
    }
    case 'STOP': {
      alert(`成功转码共${SUCCESS_COUNT}首，还差${STORE_LIST.length}未转码`);
      SUCCESS_COUNT = 0;
      LOCK = false;
      break;
    }
  }
})

//更新进度条
function updateProgress() {
  let $bar = document.querySelector('.progress-already');
  $bar.style.width = `${++PROGRESS / COUNTALL * 100}%`;
  if (PROGRESS == COUNTALL) {
    $bar.style.width = '0';
    LOCK = false;
    alert(`转换完毕,成功转码${SUCCESS_COUNT}首歌曲`);
    SUCCESS_COUNT = 0;
  }
}
