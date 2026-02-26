"use client";

import { useTranslation } from "@/i18n/context";

export default function AdminGuidePage() {
  const { locale } = useTranslation();
  const isZh = locale === "zh";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isZh ? "使用指南" : "How to Use"}
      </h1>

      <div className="space-y-6">
        {/* Creating Work Orders */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "1. 创建工单" : "1. Creating Work Orders"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '进入"工单管理"页面，点击右上角"创建工单"按钮。填写客户信息、工单描述和优先级等字段。系统会自动生成工单号，您也可以手动设置或自动生成客户密码。'
                : 'Navigate to "Work Orders" and click "Create Work Order". Fill in client information, description, and priority. The system auto-generates an order number. You can set or auto-generate a client password.'}
            </p>
            <p>
              {isZh
                ? "创建成功后，系统会显示工单号和密码。请将这些凭证提供给客户，以便他们查看工单状态。如果配置了SMTP，客户会自动收到邮件通知。"
                : "After creation, the system displays the order number and password. Share these credentials with the client so they can track their order. If SMTP is configured, clients receive an automatic email notification."}
            </p>
          </div>
        </section>

        {/* Settings */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "2. 设置" : "2. Settings"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '"设置"页面包含四个子标签：SMTP邮件配置、状态管理、用户管理和销售代表管理。'
                : 'The "Settings" page contains four sub-tabs: SMTP email configuration, Statuses, Users, and Sales Reps.'}
            </p>
            <p>
              {isZh
                ? '在"状态管理"中，可以创建、编辑和删除状态，设置颜色、排序和标记（终态、默认状态）。点击"编辑流转规则"设置允许的状态转换路径。'
                : 'Under "Statuses", create, edit, and delete statuses with colors, sort order, and flags (terminal, default). Click "Edit Transitions" to configure allowed status transitions.'}
            </p>
            <p>
              {isZh
                ? '在"用户管理"中，可以创建和管理员工账号。支持管理员、经理和员工三种角色。'
                : 'Under "Users", create and manage staff accounts with Admin, Manager, and Staff roles.'}
            </p>
            <p>
              {isZh
                ? '在"销售代表"中，可以添加和管理销售代表。销售代表可以在创建或编辑工单时分配给工单，用于跟踪哪位销售负责该客户。'
                : 'Under "Sales Reps", add and manage sales representatives. Sales reps can be assigned to work orders during creation or editing, to track which salesperson is responsible for the client.'}
            </p>
          </div>
        </section>

        {/* CSV Export */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "3. 导出CSV" : "3. CSV Export"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '在"工单管理"页面，点击"导出CSV"按钮导出当前筛选结果。可以先按状态或搜索条件筛选，再导出对应的工单数据。'
                : 'On the "Work Orders" page, click "Export CSV" to export the current filtered results. Apply status or search filters first, then export the matching data.'}
            </p>
          </div>
        </section>

        {/* Feishu Sync */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "4. 飞书同步" : "4. Feishu Sync"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? "如果配置了飞书环境变量（FEISHU_APP_ID、FEISHU_APP_SECRET等），可以将工单数据同步到飞书多维表格。飞书作为状态、截止日期和负责人的数据源。"
                : "If Feishu environment variables are configured (FEISHU_APP_ID, FEISHU_APP_SECRET, etc.), work orders can be synced to a Feishu Base. Feishu serves as the source of truth for status, due date, and assigned staff."}
            </p>
          </div>
        </section>

        {/* Audit Logs */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "5. 审计日志" : "5. Audit Logs"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '"审计日志"页面记录所有系统操作，包括登录、工单创建/更新/删除、状态变更、评论等。可以按操作类型、操作者和日期范围筛选。'
                : 'The "Audit Logs" page records all system operations including logins, work order CRUD, status changes, comments, and more. Filter by action type, actor, or date range.'}
            </p>
          </div>
        </section>

        {/* Password Reset */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "6. 重置客户密码" : "6. Reset Client Password"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '在工单详情页的"客户"信息卡片中，点击"重置密码"按钮即可生成新的随机密码。新密码会自动复制到剪贴板，同时页面会显示新密码。'
                : 'On the work order detail page, in the "Client" info card, click "Reset Password" to generate a new random password. The new password is automatically copied to your clipboard and displayed on the page.'}
            </p>
          </div>
        </section>

        {/* Role Permissions */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "7. 角色权限管理" : "7. Role Permissions"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '管理员可以在"设置 > 用户管理"页面底部的"角色权限"部分配置每个角色可以访问哪些页面标签。管理员角色始终拥有所有权限。经理和员工的权限可以自定义。'
                : 'Admins can configure which tabs each role can access in the "Role Permissions" section at the bottom of Settings > Users. The Admin role always has full access. Manager and Staff permissions are customizable.'}
            </p>
          </div>
        </section>

        {/* Manual Save */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "8. 工单编辑与保存" : "8. Editing & Saving Work Orders"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '在工单详情页编辑字段（进度、优先级、预计完成时间、负责人、销售代表、服务内容）时，更改不会自动保存。修改后会出现"未保存更改"提示栏，点击"保存"按钮提交所有更改，或点击"放弃更改"恢复原始值。状态更新仍然是即时生效的。'
                : 'When editing fields on the work order detail page (progress, priority, expected completion time, staff, sales rep, service description), changes are not auto-saved. A "Unsaved changes" bar appears with Save and Discard buttons. Click Save to submit all changes at once, or Discard to revert. Status updates remain immediate.'}
            </p>
          </div>
        </section>

        {/* Email Notifications */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "9. 邮件通知" : "9. Email Notifications"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? "系统会在以下场景自动发送邮件通知给客户（前提是已配置SMTP且工单填写了客户邮箱）："
                : "The system automatically sends email notifications to clients in the following scenarios (requires SMTP configuration and client email on the work order):"}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {isZh
                  ? "工单创建：客户收到工单号和密码"
                  : "Work order created: Client receives order number and password"}
              </li>
              <li>
                {isZh
                  ? "状态更新：客户收到新状态通知"
                  : "Status updated: Client receives new status notification"}
              </li>
              <li>
                {isZh
                  ? "员工回复评论：客户收到新回复通知"
                  : "Staff reply: Client receives new comment notification"}
              </li>
              <li>
                {isZh
                  ? "工单完成：客户收到服务评价邀请邮件"
                  : "Work order completed: Client receives a rating invitation email"}
              </li>
            </ul>
            <p>
              {isZh
                ? '请在"设置 > SMTP"中配置邮件服务器。所有邮件链接指向客户登录页面，客户可通过工单号和密码登录查看详情。'
                : 'Configure the email server under "Settings > SMTP". All email links point to the client login page where clients can log in with their order number and password.'}
            </p>
          </div>
        </section>

        {/* Client Rating System */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "10. 客户评价系统" : "10. Client Rating System"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? '当工单状态变为"已完成"时，系统会自动向客户发送评价邮件。客户可以通过邮件中的链接或在工单详情页提交1-5星的评价和反馈。'
                : 'When a work order status changes to "Completed", the system automatically sends a rating email to the client. Clients can submit a 1-5 star rating with feedback via the email link or from the work order page.'}
            </p>
            <p>
              {isZh
                ? "评价页面提供6个快捷评语按钮（3个好评、3个差评），客户可以点击快速填入，也可以手动输入评语。每个工单只能评价一次。"
                : "The rating page provides 6 quick-fill comment buttons (3 positive, 3 negative). Clients can click to auto-fill or type their own feedback. Each work order can only be rated once."}
            </p>
            <p>
              {isZh
                ? '管理员可以在工单详情页右侧的"客户评价"卡片中查看评分和评语。'
                : 'Admins can view the rating score and comments in the "Client Rating" card on the right side of the work order detail page.'}
            </p>
          </div>
        </section>

        {/* Client Work Order Page */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "11. 客户工单页面" : "11. Client Work Order Page"}
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {isZh
                ? "客户登录后可以查看工单详情，包括：工单号和当前状态、进度条、状态时间线（黄色高亮显示）、服务内容、预计完成时间、负责人信息。客户可以在评论区与员工沟通。"
                : "After logging in, clients can view work order details including: order number and current status, progress bar, status timeline (highlighted in yellow), service description, expected completion time, and assigned staff. Clients can communicate with staff via the comments section."}
            </p>
            <p>
              {isZh
                ? "工单完成后，页面会显示评价入口，客户可以直接提交对服务的评价。如果已评价，则显示已提交的评分和评语。"
                : "After completion, a rating prompt appears on the page. Clients can submit their service rating directly. If already rated, the submitted score and comment are displayed."}
            </p>
          </div>
        </section>

        {/* Field Name Reference */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isZh ? "12. 字段名称参考" : "12. Field Name Reference"}
          </h2>
          <div className="text-sm text-gray-600">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium text-gray-700">
                      {isZh ? "字段" : "Field"}
                    </th>
                    <th className="py-2 pr-4 font-medium text-gray-700">
                      English
                    </th>
                    <th className="py-2 font-medium text-gray-700">中文</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-4 text-gray-500">
                      {isZh ? "预计完成时间" : "Due date"}
                    </td>
                    <td className="py-2 pr-4">Expected Completion Time</td>
                    <td className="py-2">预计完成时间</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-gray-500">
                      {isZh ? "服务内容" : "Description"}
                    </td>
                    <td className="py-2 pr-4">Service Description</td>
                    <td className="py-2">服务内容</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-gray-500">
                      {isZh ? "状态时间线" : "Timeline"}
                    </td>
                    <td className="py-2 pr-4">Status Timeline</td>
                    <td className="py-2">状态时间线</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-gray-500">
                      {isZh ? "客户评价" : "Rating"}
                    </td>
                    <td className="py-2 pr-4">Client Rating (1-5 stars)</td>
                    <td className="py-2">客户评价（1-5星）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
