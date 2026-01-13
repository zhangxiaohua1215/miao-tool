// POM Helper - 配置文件
// 中英文映射表和扫描规则

window.POMConfig = {
  // 中英文映射表
  zhToEn: {
    // 按钮类
    '提交': 'submit', '查询': 'search', '搜索': 'search',
    '新增': 'add', '新建': 'create', '添加': 'add',
    '删除': 'delete', '移除': 'remove',
    '编辑': 'edit', '修改': 'modify', '更新': 'update',
    '保存': 'save', '取消': 'cancel', '关闭': 'close',
    '确定': 'confirm', '确认': 'confirm', '是': 'yes', '否': 'no',
    '重置': 'reset', '清空': 'clear', '清除': 'clear',
    '导入': 'import', '导出': 'export',
    '上传': 'upload', '下载': 'download',
    '刷新': 'refresh', '返回': 'back', '后退': 'back',
    '下一步': 'next', '上一步': 'prev', '继续': 'continue',
    '登录': 'login', '注册': 'register', '退出': 'logout',
    '启用': 'enable', '禁用': 'disable',
    '展开': 'expand', '收起': 'collapse',
    '全选': 'selectAll', '批量': 'batch',
    '审批': 'approve', '驳回': 'reject',
    '发布': 'publish', '撤回': 'revoke',
    '复制': 'copy', '粘贴': 'paste',
    '预览': 'preview', '打印': 'print',
    '详情': 'detail', '查看': 'view',

    // 输入框类
    '用户名': 'username', '账号': 'account', '账户': 'account',
    '密码': 'password', '确认密码': 'confirmPassword',
    '手机': 'phone', '手机号': 'phone', '电话': 'tel',
    '邮箱': 'email', '邮件': 'email',
    '地址': 'address', '详细地址': 'detailAddress',
    '姓名': 'name', '名称': 'name', '标题': 'title',
    '备注': 'remark', '描述': 'description', '说明': 'desc',
    '开始时间': 'startTime', '结束时间': 'endTime',
    '开始日期': 'startDate', '结束日期': 'endDate',
    '创建时间': 'createTime', '更新时间': 'updateTime',
    '关键词': 'keyword', '关键字': 'keyword',
    '验证码': 'captcha', '短信验证码': 'smsCode',
    '金额': 'amount', '数量': 'quantity', '价格': 'price',
    '编号': 'code', '订单号': 'orderNo',
  },

  // 扫描规则
  scanRules: [
    { selector: '.ant-table-wrapper', type: 'Table', onlyFirst: false },
    { selector: '.ant-pro-table-search, .ant-form.ant-form-horizontal', type: 'Search', onlyFirst: true },
    { selector: 'button.ant-btn-primary, button[type="submit"], button.ant-btn-danger', type: 'Button' },
    { selector: 'input.ant-input, .ant-input-affix-wrapper > input', type: 'Input' },
    { selector: '.ant-select:not(.ant-select-in-form-item .ant-select)', type: 'Select' },
    { selector: 'textarea.ant-input', type: 'TextArea' },
    { selector: '.ant-picker', type: 'DatePicker' },
    { selector: '.ant-modal-wrap:not([style*="display: none"])', type: 'Modal' },
  ],

  // 支持的组件类型（用于语法高亮）
  componentTypes: ['Page', 'Locator', 'Button', 'Input', 'Table', 'Select', 'TextArea', 'DatePicker', 'Modal', 'Search', 'Form', 'Link'],
};

