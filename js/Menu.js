const electron = require('electron');
const Menu = electron.Menu;
var template = [{
  label: '选项',
  submenu: [{
    label: '关于作者',
    click: function () {
      electron.shell.openExternal('http://www.leelei.info')
    }
  }]
}];
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu);