
(() => {
    'use strict';

    const API_ROOT = (
        localStorage.getItem('API_ROOT') || 'https://localhost:7091'
    ).replace(/\/+$/, '');

    const API = API_ROOT + '/api';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const state = {
        books: [],
        genres: [],
        authors: [],
        publishers: [],
        customers: [],
        orders: [],
        user: null,
        view: 'dashboard',
        chatContacts: [],
        chatPartnerId: null,
        chatMessages: [],
        chatPollTimer: null,
        chatLoading: false
    };

    const get = (obj, ...keys) => {
        for (const key of keys) {
            if (obj && obj[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return '';
    };

    const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    const money = value =>
        Number(value || 0).toLocaleString('vi-VN') + ' ₫';

    const date = value => {
        if (!value) return '—';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime())
            ? '—'
            : parsed.toLocaleDateString('vi-VN');
    };

    function unwrap(value) {
        let result = value;

        for (let i = 0; i < 5; i++) {
            if (Array.isArray(result)) return result;
            if (!result || typeof result !== 'object') return result;

            const next =
                result.data ??
                result.Data ??
                result.result ??
                result.Result ??
                result.items ??
                result.Items;

            if (next === undefined || next === result) break;
            result = next;
        }

        return result;
    }

    function asArray(value, label) {
        const result = unwrap(value);

        if (Array.isArray(result)) return result;
        if (result == null || result === '') return [];

        throw new Error(
            `API ${label} trả dữ liệu không phải danh sách. Hãy kiểm tra Response.`
        );
    }

    function notice(message, type = 'success') {
        const el = $('#notice');

        if (!el) {
            console[type === 'error' ? 'error' : 'log'](message);
            return;
        }

        el.textContent = message;
        el.className = 'notice ' + type;
        el.hidden = false;

        window.clearTimeout(notice.timer);

        notice.timer = window.setTimeout(() => {
            el.hidden = true;
        }, 6000);
    }

    async function request(path, options = {}) {
        let response;

        try {
            response = await fetch(API + path, {
                ...options,
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    ...(options.body !== undefined
                        ? { 'Content-Type': 'application/json' }
                        : {}),
                    ...(options.headers || {})
                },
                body: options.body !== undefined
                    ? (
                        typeof options.body === 'string'
                            ? options.body
                            : JSON.stringify(options.body)
                    )
                    : undefined
            });
        } catch (error) {
            console.error('Không kết nối được API:', API + path, error);

            throw new Error(
                `Không kết nối được API ${API + path}. Kiểm tra API đang chạy, chứng chỉ HTTPS và cấu hình CORS.`
            );
        }

        const raw = await response.text();
        let data = null;

        try {
            data = raw ? JSON.parse(raw) : null;
        } catch {
            data = raw;
        }

        if (!response.ok) {
            const detail = typeof data === 'object' && data
                ? get(
                    data,
                    'message',
                    'Message',
                    'title',
                    'Title',
                    'detail',
                    'Detail'
                )
                : '';

            if (response.status === 401) {
                throw new Error(
                    detail || 'API trả về 401: chưa đăng nhập hoặc Session đã hết hạn.'
                );
            }

            if (response.status === 403) {
                throw new Error(
                    detail || 'API trả về 403: Session không có quyền Admin.'
                );
            }

            throw new Error(
                detail || `API trả về HTTP ${response.status} tại ${path}.`
            );
        }

        if (
            data &&
            typeof data === 'object' &&
            (
                data.success === false ||
                data.Success === false
            )
        ) {
            throw new Error(
                get(data, 'message', 'Message') || 'API trả về lỗi.'
            );
        }

        return data;
    }

    function requireAdmin() {
    const possibleKeys = [
        'bookstore-admin-user',
        'apiq-user',
        'currentUser',
        'user'
    ];

    let user = null;

    for (const key of possibleKeys) {
        try {
            user = JSON.parse(
                sessionStorage.getItem(key) ||
                localStorage.getItem(key) ||
                'null'
            );
        } catch {
            user = null;
        }

        if (user && typeof user === 'object') {
            break;
        }
    }

    state.user = user;

    const role = String(
        get(user, 'role', 'Role', 'vaiTro', 'VaiTro', 'tenVaiTro', 'TenVaiTro')
    ).trim().toLowerCase();

    if (
        !user ||
        !['admin', 'administrator', 'quản trị viên'].includes(role)
    ) {
        location.replace('login.html');
        return false;
    }

    const name =
        get(user, 'tenKhachHang', 'TenKhachHang') ||
        get(user, 'userName', 'UserName') ||
        get(user, 'tenDangNhap', 'TenDangNhap') ||
        'Quản trị viên';

    if ($('#adminName')) {
        $('#adminName').textContent = name;
    }

    if ($('#welcomeName')) {
        $('#welcomeName').textContent = name;
    }

    return true;
}

    function rowsOrEmpty(list, columns, empty = 'Chưa có dữ liệu.') {
        return list.length
            ? list.join('')
            : `<tr><td class="empty-cell" colspan="${columns}">${esc(empty)}</td></tr>`;
    }

    const act = (type, key, label = 'Sửa') => `
        <div class="action-group">
            <button class="text-btn" data-action="${type}-edit" data-id="${esc(key)}">${label}</button>
            <button class="text-btn danger" data-action="${type}-delete" data-id="${esc(key)}">Xóa</button>
        </div>
    `;

    function renderBooks() {
        const search = ($('#bookSearch')?.value || '').toLowerCase();

        const list = state.books.filter(book =>
            [
                get(book, 'tenSach', 'TenSach'),
                get(book, 'tenTacGia', 'TenTacGia'),
                get(book, 'tenTheLoai', 'TenTheLoai')
            ].join(' ').toLowerCase().includes(search)
        );

        $('#booksTable').innerHTML = rowsOrEmpty(list.map(book => {
            const bookId = get(book, 'maSach', 'MaSach');
            const title = get(book, 'tenSach', 'TenSach') || '(Chưa có tên)';
            const image = get(book, 'anhBia', 'AnhBia');

            const genre = get(book, 'tenTheLoai', 'TenTheLoai') ||
                get(
                    state.genres.find(item =>
                        String(get(item, 'maTheLoai', 'MaTheLoai')) ===
                        String(get(book, 'maTheLoai', 'MaTheLoai'))
                    ),
                    'tenTheLoai',
                    'TenTheLoai'
                ) || '—';

            const author = get(book, 'tenTacGia', 'TenTacGia') ||
                get(
                    state.authors.find(item =>
                        String(get(item, 'maTacGia', 'MaTacGia')) ===
                        String(get(book, 'maTacGia', 'MaTacGia'))
                    ),
                    'tenTacGia',
                    'TenTacGia'
                ) || '—';

            return `
                <tr>
                    <td>
                        <div class="book-cell">
                            ${image
                                ? `<img class="book-cover" src="${esc(image)}" alt="" onerror="this.style.display='none'">`
                                : '<div class="book-cover"></div>'}
                            <div>
                                <b>${esc(title)}</b>
                                <small>Mã sách: ${esc(bookId)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${esc(genre)}</td>
                    <td>${esc(author)}</td>
                    <td>${esc(get(book, 'tenNhaXuatBan', 'TenNhaXuatBan') || '—')}</td>
                    <td class="money">${money(get(book, 'gia', 'Gia'))}</td>
                    <td>
                        <button type="button"
                                class="btn btn-warning btn-sm"
                                onclick="openBookForm('${bookId}')">
                            <i class="fas fa-edit"></i> Sửa
                        </button>

                        <button type="button"
                                class="btn btn-danger btn-sm"
                                onclick="deleteBook('${bookId}')">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
        }), 6, 'Không tìm thấy sách phù hợp.');
    }

    function renderGenres() {
        $('#genresTable').innerHTML = rowsOrEmpty(
            state.genres.map(item => `
                <tr>
                    <td>${esc(get(item, 'maTheLoai', 'MaTheLoai'))}</td>
                    <td><b>${esc(get(item, 'tenTheLoai', 'TenTheLoai'))}</b></td>
                    <td>${act('genre', get(item, 'maTheLoai', 'MaTheLoai'))}</td>
                </tr>
            `),
            3
        );
    }

    function renderAuthors() {
        $('#authorsTable').innerHTML = rowsOrEmpty(
            state.authors.map(item => `
                <tr>
                    <td>${esc(get(item, 'maTacGia', 'MaTacGia'))}</td>
                    <td><b>${esc(get(item, 'tenTacGia', 'TenTacGia'))}</b></td>
                    <td>${act('author', get(item, 'maTacGia', 'MaTacGia'))}</td>
                </tr>
            `),
            3
        );
    }

    function renderPublishers() {
        $('#publishersTable').innerHTML = rowsOrEmpty(
            state.publishers.map(item => `
                <tr>
                    <td>${esc(get(item, 'maNhaXuatBan', 'MaNhaXuatBan'))}</td>
                    <td><b>${esc(get(item, 'tenNhaXuatBan', 'TenNhaXuatBan'))}</b></td>
                    <td>${esc(get(item, 'diaChi', 'DiaChi') || '—')}</td>
                    <td>${act('publisher', get(item, 'maNhaXuatBan', 'MaNhaXuatBan'))}</td>
                </tr>
            `),
            4
        );
    }

    function renderCustomers() {
        const search = ($('#customerSearch')?.value || '').toLowerCase();

        const list = state.customers.filter(item =>
            [
                get(item, 'tenKhachHang', 'TenKhachHang'),
                get(item, 'tenDangNhap', 'TenDangNhap'),
                get(item, 'email', 'Email'),
                get(item, 'soDienThoai', 'SoDienThoai')
            ].join(' ').toLowerCase().includes(search)
        );

        $('#customersTable').innerHTML = rowsOrEmpty(
            list.map(item => {
                const name = get(item, 'tenKhachHang', 'TenKhachHang') || '—';
                const role = get(item, 'role', 'Role') || 'User';
                const verified = get(item, 'isVerified', 'IsVerified');

                return `
                    <tr>
                        <td>
                            <div class="book-cell">
                                <div class="avatar">${esc(name.slice(0, 1).toUpperCase())}</div>
                                <div>
                                    <b>${esc(name)}</b>
                                    <small>@${esc(get(item, 'tenDangNhap', 'TenDangNhap') || '—')}</small>
                                </div>
                            </div>
                        </td>
                        <td>${esc(get(item, 'email', 'Email') || '—')}</td>
                        <td>${esc(get(item, 'soDienThoai', 'SoDienThoai') || '—')}</td>
                        <td>
                            <span class="pill ${String(role).toLowerCase() === 'admin' ? 'paid' : 'unpaid'}">
                                ${esc(role)}
                            </span>
                        </td>
                        <td>
                            <span class="pill ${verified ? 'verified' : 'unverified'}">
                                ${verified ? 'Đã xác minh' : 'Chưa xác minh'}
                            </span>
                        </td>
                        <td>
                            <button class="text-btn"
                                data-action="customer-detail"
                                data-id="${esc(get(item, 'maKhachHang', 'MaKhachHang'))}">
                                Chi tiết
                            </button>
                        </td>
                    </tr>
                `;
            }),
            6,
            'Không tìm thấy khách hàng.'
        );
    }

    function isPaid(value) {
    return value === true ||
        value === 1 ||
        String(value).trim().toLowerCase() === 'true';
    }

    function renderOrders() {
        const search = ($('#orderSearch')?.value || '').toLowerCase();

        const list = state.orders.filter(item =>
            [
                get(item, 'maHoaDon', 'MaHoaDon'),
                get(item, 'tenNguoiNhan', 'TenNguoiNhan'),
                get(item, 'diaChi', 'DiaChi')
            ].join(' ').toLowerCase().includes(search)
        );

        $('#ordersTable').innerHTML = rowsOrEmpty(
            list.map(item => {
                const orderId = get(item, 'maHoaDon', 'MaHoaDon');
                const paid = isPaid(
                    get(item, 'trangThaiThanhToan', 'TrangThaiThanhToan')
                );

                return `
                    <tr>
                        <td><b>#${esc(orderId)}</b></td>
                        <td>${date(get(item, 'ngayLap', 'NgayLap'))}</td>
                        <td>
                            ${esc(get(item, 'tenNguoiNhan', 'TenNguoiNhan') || '—')}
                            <small style="display:block;color:#969aa5;margin-top:4px">
                                ${esc(get(item, 'soDienThoai', 'SoDienThoai') || '')}
                            </small>
                        </td>
                        <td class="money">${money(get(item, 'tongTien', 'TongTien'))}</td>
                        <td>
                            <span class="pill ${paid ? 'paid' : 'unpaid'}">
                                ${paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                        </td>
                        <td>
                            <div class="action-group">
                                <button class="text-btn" data-action="order-detail" data-id="${esc(orderId)}">Chi tiết</button>
                                <button class="text-btn" data-action="order-edit" data-id="${esc(orderId)}">Sửa</button>
                                <button class="text-btn" data-action="order-toggle"
                                    data-id="${esc(orderId)}" data-paid="${paid}">
                                    ${paid ? 'Hủy xác nhận' : 'Xác nhận TT'}
                                </button>
                                <button class="text-btn danger" data-action="order-delete" data-id="${esc(orderId)}">Xóa</button>
                            </div>
                        </td>
                    </tr>
                `;
            }),
            6,
            'Chưa có hóa đơn.'
        );
    }

    function renderRecentOrders() {
        const list = [...state.orders]
            .sort((a, b) =>
                new Date(get(b, 'ngayLap', 'NgayLap') || 0) -
                new Date(get(a, 'ngayLap', 'NgayLap') || 0)
            )
            .slice(0, 5);

        $('#recentOrders').innerHTML = rowsOrEmpty(
            list.map(item => {
                const orderId = get(item, 'maHoaDon', 'MaHoaDon');
                const paid = isPaid(
                    get(item, 'trangThaiThanhToan', 'TrangThaiThanhToan')
                );

                return `
                    <tr>
                        <td><b>#${esc(orderId)}</b></td>
                        <td>${date(get(item, 'ngayLap', 'NgayLap'))}</td>
                        <td class="money">${money(get(item, 'tongTien', 'TongTien'))}</td>
                        <td>
                            <span class="pill ${paid ? 'paid' : 'unpaid'}">
                                ${paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                        </td>
                        <td>
                            <button class="text-btn" data-action="order-detail" data-id="${esc(orderId)}">
                                Chi tiết
                            </button>
                        </td>
                    </tr>
                `;
            }),
            5,
            'Chưa có hóa đơn.'
        );
    }

    async function loadBooks() {
        state.books = asArray(await request('/sach'), 'sách');
        renderBooks();
    }

    async function loadGenres() {
        state.genres = asArray(await request('/the-loai'), 'thể loại');
        renderGenres();
    }

    async function loadAuthors() {
        state.authors = asArray(await request('/tac-gia'), 'tác giả');
        renderAuthors();
    }

    async function loadPublishers() {
        state.publishers = asArray(await request('/nha-xuat-ban'), 'nhà xuất bản');
        renderPublishers();
    }

    async function loadCustomers() {
        state.customers = asArray(
            await request('/KhachHang/DanhSachTaiKhoan'),
            'khách hàng'
        );
        renderCustomers();
    }

    async function loadOrders() {
        state.orders = asArray(await request('/hoa-don'), 'hóa đơn');
        renderOrders();
        renderRecentOrders();
    }


    function chatAdminId() {
        const user = JSON.parse(sessionStorage.getItem('bookstore-admin-user') || '{}');
        return Number(get(user, 'maKhachHang', 'MaKhachHang', 'id', 'Id', 'userId', 'UserId')) || 6;
    }

    function chatCustomerId(customer) {
        return Number(get(customer, 'maKhachHang', 'MaKhachHang', 'id', 'Id'));
    }

    function chatCustomerName(customer) {
        return String(get(customer, 'tenKhachHang', 'TenKhachHang', 'tenDangNhap', 'TenDangNhap', 'hoTen', 'HoTen') || `Khách hàng #${chatCustomerId(customer)}`);
    }

    function chatMessageSender(message) {
        return Number(get(message, 'nguoiGui', 'NguoiGui', 'maNguoiGui', 'MaNguoiGui'));
    }

    function chatMessageText(message) {
        return String(get(message, 'noiDung', 'NoiDung', 'noiDungTinNhan', 'NoiDungTinNhan') || '');
    }

    function chatMessageDate(message) {
        return get(message, 'thoiGianGui', 'ThoiGianGui', 'ngayGui', 'NgayGui', 'createdAt', 'CreatedAt');
    }

    function chatFormatDate(value) {
        if (!value) return '';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    async function fetchChatHistory(customerId) {
        const adminId = chatAdminId();
        const result = await request(`/TinNhan/history?user1=${encodeURIComponent(adminId)}&user2=${encodeURIComponent(customerId)}`, {
            headers: { 'X-User-Id': String(adminId) }
        });
        return asArray(result, 'lịch sử tin nhắn');
    }

    function renderChatContacts() {
        const container = $('#adminChatContacts');
        const count = $('#chatContactCount');
        if (!container) return;

        const keyword = ($('#chatCustomerSearch')?.value || '').trim().toLowerCase();
        const contacts = state.chatContacts.filter(item =>
            item.name.toLowerCase().includes(keyword) ||
            String(item.id).includes(keyword) ||
            item.email.toLowerCase().includes(keyword)
        );

        if (count) count.textContent = `${state.chatContacts.length} khách hàng`;
        if (!contacts.length) {
            container.innerHTML = `<div class="admin-chat-empty">${state.chatContacts.length ? 'Không tìm thấy khách hàng phù hợp.' : 'Chưa tìm thấy cuộc trò chuyện nào có tin nhắn.'}</div>`;
            return;
        }

        container.innerHTML = contacts.map(contact => {
            const preview = contact.lastMessage ? chatMessageText(contact.lastMessage) : 'Chưa có nội dung';
            const time = contact.lastMessage ? chatFormatDate(chatMessageDate(contact.lastMessage)) : '';
            return `
                <button type="button" class="admin-chat-contact ${Number(state.chatPartnerId) === contact.id ? 'active' : ''}" data-chat-customer="${esc(contact.id)}">
                    <span class="admin-chat-avatar">${esc(contact.name.trim().charAt(0).toUpperCase() || 'K')}</span>
                    <span class="admin-chat-contact-text">
                        <span class="admin-chat-contact-name">${esc(contact.name)}</span>
                        <span class="admin-chat-contact-preview">${esc(preview)}</span>
                    </span>
                    <span class="admin-chat-contact-time">${esc(time)}</span>
                </button>`;
        }).join('');
    }

    function renderChatMessages(messages) {
        const container = $('#adminChatMessages');
        if (!container) return;
        const adminId = chatAdminId();

        if (!messages.length) {
            container.innerHTML = '<div class="admin-chat-empty">Chưa có tin nhắn trong cuộc trò chuyện này.</div>';
            return;
        }

        container.innerHTML = messages.map(message => {
            const mine = chatMessageSender(message) === adminId;
            return `
                <div class="admin-chat-message ${mine ? 'mine' : ''}">
                    <div class="admin-chat-message-sender">${mine ? 'Bạn (Admin)' : esc(state.chatContacts.find(x => x.id === Number(state.chatPartnerId))?.name || 'Khách hàng')}</div>
                    <div class="admin-chat-message-body">${esc(chatMessageText(message))}</div>
                    <span class="admin-chat-message-time">${esc(chatFormatDate(chatMessageDate(message)))}</span>
                </div>`;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    async function loadChatContacts() {
        const container = $('#adminChatContacts');
        if (container) container.innerHTML = '<div class="admin-chat-empty">Đang tải danh sách khách hàng đã nhắn...</div>';

        const rawCustomers = await request('/KhachHang/DanhSachTaiKhoan', {
            headers: { 'X-User-Id': String(chatAdminId()) }
        });
        const customers = asArray(rawCustomers, 'khách hàng');
        const candidates = customers.filter(customer => {
            const id = chatCustomerId(customer);
            return id > 0 && id !== chatAdminId();
        });

        // API hiện chưa có endpoint riêng trả danh sách người đã nhắn tin.
        // Lấy lịch sử từng khách với Admin rồi chỉ hiển thị các cuộc trò chuyện có tin nhắn.
        const results = await Promise.allSettled(candidates.map(async customer => {
            const messages = await fetchChatHistory(chatCustomerId(customer));
            if (!messages.length) return null;
            const lastMessage = [...messages].sort((a, b) =>
                new Date(chatMessageDate(b) || 0).getTime() - new Date(chatMessageDate(a) || 0).getTime()
            )[0];
            return {
                id: chatCustomerId(customer),
                name: chatCustomerName(customer),
                email: String(get(customer, 'email', 'Email') || ''),
                messages,
                lastMessage
            };
        }));

        state.chatContacts = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value)
            .sort((a, b) => new Date(chatMessageDate(b.lastMessage) || 0) - new Date(chatMessageDate(a.lastMessage) || 0));

        renderChatContacts();

        if (state.chatPartnerId && state.chatContacts.some(c => c.id === Number(state.chatPartnerId))) {
            await openAdminChat(state.chatPartnerId, false);
        } else if (state.chatContacts.length) {
            await openAdminChat(state.chatContacts[0].id, false);
        } else {
            state.chatPartnerId = null;
            $('#adminChatPartnerName').textContent = 'Chưa có khách hàng nhắn tin';
            $('#adminChatPartnerInfo').textContent = 'Khách hàng sẽ xuất hiện tại đây sau khi có tin nhắn với Admin.';
            $('#adminChatMessages').innerHTML = '<div class="admin-chat-empty">Chưa có cuộc trò chuyện nào.</div>';
            $('#adminChatMessageInput').disabled = true;
            $('#adminChatSendBtn').disabled = true;
        }
    }

    async function openAdminChat(customerId, updateList = true) {
        const contact = state.chatContacts.find(item => item.id === Number(customerId));
        if (!contact) return;
        state.chatPartnerId = contact.id;
        $('#adminChatPartnerName').textContent = contact.name;
        $('#adminChatPartnerInfo').textContent = contact.email ? `${contact.email} · Mã khách hàng: ${contact.id}` : `Mã khách hàng: ${contact.id}`;
        $('#adminChatMessageInput').disabled = false;
        $('#adminChatSendBtn').disabled = false;
        if (updateList) renderChatContacts();

        const container = $('#adminChatMessages');
        if (container) container.innerHTML = '<div class="admin-chat-empty">Đang tải lịch sử tin nhắn...</div>';
        try {
            const messages = await fetchChatHistory(contact.id);
            if (Number(state.chatPartnerId) !== contact.id) return;
            state.chatMessages = messages;
            contact.messages = messages;
            contact.lastMessage = messages.length ? [...messages].sort((a, b) =>
                new Date(chatMessageDate(b) || 0).getTime() - new Date(chatMessageDate(a) || 0).getTime()
            )[0] : null;
            renderChatMessages(messages);
            renderChatContacts();
        } catch (error) {
            if (container) container.innerHTML = `<div class="admin-chat-empty">Không tải được lịch sử: ${esc(error.message || 'Lỗi API')}</div>`;
            throw error;
        }
    }

    async function sendAdminChatMessage(event) {
        event.preventDefault();
        const input = $('#adminChatMessageInput');
        const button = $('#adminChatSendBtn');
        const content = input?.value.trim();
        if (!content || !state.chatPartnerId) return;

        const adminId = chatAdminId();
        const customerId = Number(state.chatPartnerId);
        input.value = '';
        if (button) button.disabled = true;
        if (input) input.disabled = true;

        try {
            await request('/TinNhan/send', {
                method: 'POST',
                headers: { 'X-User-Id': String(adminId) },
                body: { NguoiGui: adminId, NguoiNhan: customerId, NoiDung: content }
            });
            await openAdminChat(customerId, false);
            await loadChatContacts();
        } catch (error) {
            notice(error.message || 'Không gửi được tin nhắn.', 'error');
            if (input) input.value = content;
        } finally {
            if (input) {
                input.disabled = !state.chatPartnerId;
                input.focus();
            }
            if (button) button.disabled = !state.chatPartnerId;
        }
    }

    async function initAdminMessages() {
        if (!$('#view-messages')) return;
        await loadChatContacts();
        if (state.chatPollTimer) clearInterval(state.chatPollTimer);
        state.chatPollTimer = setInterval(async () => {
            if (state.view !== 'messages' || state.chatLoading) return;
            state.chatLoading = true;
            try {
                if (state.chatPartnerId) {
                    const messages = await fetchChatHistory(state.chatPartnerId);
                    state.chatMessages = messages;
                    const contact = state.chatContacts.find(c => c.id === Number(state.chatPartnerId));
                    if (contact) {
                        contact.messages = messages;
                        contact.lastMessage = messages.length ? [...messages].sort((a, b) =>
                            new Date(chatMessageDate(b) || 0).getTime() - new Date(chatMessageDate(a) || 0).getTime()
                        )[0] : null;
                    }
                    renderChatMessages(messages);
                    renderChatContacts();
                }
            } catch (error) {
                console.warn('[Admin chat] Không thể làm mới tin nhắn:', error);
            } finally {
                state.chatLoading = false;
            }
        }, 5000);
    }

    async function loadView(name) {
        if (name === 'books') {
            await Promise.all([
                loadBooks(),
                loadGenres(),
                loadAuthors(),
                loadPublishers()
            ]);
        } else if (name === 'genres') {
            await loadGenres();
        } else if (name === 'authors') {
            await loadAuthors();
        } else if (name === 'publishers') {
            await loadPublishers();
        } else if (name === 'customers') {
            await loadCustomers();
        } else if (name === 'orders') {
            await loadOrders();
        }
    }

    async function loadDashboard() {
        const results = await Promise.allSettled([
            loadBooks(),
            loadCustomers(),
            loadOrders()
        ]);

        $('#statBooks').textContent =
            results[0].status === 'fulfilled' ? state.books.length : 'Lỗi';

        $('#statCustomers').textContent =
            results[1].status === 'fulfilled' ? state.customers.length : 'Lỗi';

        $('#statOrders').textContent =
            results[2].status === 'fulfilled' ? state.orders.length : 'Lỗi';

        $('#statPaid').textContent =
            results[2].status === 'fulfilled'
                ? state.orders.filter(item =>
                    isPaid(
                        get(item, 'trangThaiThanhToan', 'TrangThaiThanhToan')
                    )
                ).length
                : 'Lỗi';

        const errors = results
            .filter(result => result.status === 'rejected')
            .map(result => result.reason?.message || 'Lỗi không xác định');

        if (errors.length) {
            notice(errors.join(' • '), 'error');
        }
    }

    function showView(name) {
        const allowedViews = [
            'dashboard',
            'books',
            'genres',
            'authors',
            'publishers',
            'customers',
            'orders',
            'messages'
        ];

        if (!allowedViews.includes(name)) return;

        state.view = name;

        $$('.view').forEach(element => {
            element.classList.toggle(
                'active',
                element.id === 'view-' + name
            );
        });

        $$('.nav-item').forEach(element => {
            element.classList.toggle(
                'active',
                element.dataset.view === name
            );
        });

        const labels = {
            dashboard: 'Tổng quan',
            books: 'Quản lý sách',
            genres: 'Quản lý thể loại',
            authors: 'Quản lý tác giả',
            publishers: 'Quản lý nhà xuất bản',
            customers: 'Quản lý khách hàng',
            orders: 'Quản lý hóa đơn',
            messages: 'Tin nhắn khách hàng'
        };

        if ($('#pageTitle')) {
            $('#pageTitle').textContent = labels[name] || 'Quản trị';
        }

        $('#sidebar')?.classList.remove('open');

        if (name === 'dashboard') {
            loadDashboard().catch(error => notice(error.message, 'error'));
        } else if (name === 'messages') {
            initAdminMessages().catch(error => notice(error.message || 'Không tải được tin nhắn.', 'error'));
        } else {
            loadView(name).catch(error => notice(error.message, 'error'));
        }
    }

    async function openBookForm(id = null) {
    console.log('Đã nhấn Sửa sách, ID:', id);

    // Nếu có ID thì lấy thông tin sách từ API
    if (id !== null) {
    try {
        const response = await request(
            `/sach/${encodeURIComponent(id)}`
        );

        book = response?.data ?? response?.Data ?? response;

        if (!book || typeof book !== 'object' || book.success === false) {
            throw new Error(
                book?.message || book?.Message || 'Không tìm thấy thông tin sách.'
            );
        }
    } catch (error) {
        console.error('Lỗi lấy thông tin sách:', error);
        notice(error.message || 'Không thể tải thông tin sách.', 'error');
        return;
    }
}

    const get = (obj, ...keys) => {
        for (const key of keys) {
            if (obj?.[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return '';
    };

    const esc = value => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const value = (name, ...aliases) =>
        esc(get(book, name, ...aliases));

    const isEdit = id !== null;

    const html = `
        <form id="book-form">
            <h4 class="mb-3">
                ${isEdit ? 'Cập nhật thông tin sách' : 'Thêm sách mới'}
            </h4>

            <div class="mb-3">
                <label class="form-label">Tên sách</label>
                <input class="form-control" name="TenSach"
                       value="${value('tenSach', 'TenSach')}"
                       required>
            </div>

            <div class="mb-3">
                <label class="form-label">ISBN</label>
                <input class="form-control" name="ISBN"
                       value="${value('isbn', 'ISBN')}">
            </div>

            <div class="mb-3">
                <label class="form-label">Mã thể loại</label>
                <input class="form-control" name="MaTheLoai"
                       type="number" min="1"
                       value="${value('maTheLoai', 'MaTheLoai')}"
                       required>
            </div>

            <div class="mb-3">
                <label class="form-label">Tác giả</label>
                <input class="form-control" name="TacGia"
                       value="${value('tacGia', 'TacGia')}"
                       required>
            </div>

            <div class="mb-3">
                <label class="form-label">Nhà xuất bản</label>
                <input class="form-control" name="NhaXuatBan"
                       value="${value('nhaXuatBan', 'NhaXuatBan')}">
            </div>

            <div class="mb-3">
                <label class="form-label">Giá</label>
                <input class="form-control" name="Gia"
                       type="number" min="0" step="0.01"
                       value="${value('gia', 'Gia')}" required>
            </div>

            <div class="mb-3">
                <label class="form-label">Số lượng</label>
                <input class="form-control" name="SoLuong"
                       type="number" min="0"
                       value="${value('soLuong', 'SoLuong')}"
                       required>
            </div>

            <div class="mb-3">
                <label class="form-label">Năm xuất bản</label>
                <input class="form-control" name="NamXuatBan"
                       type="number"
                       value="${value('namXuatBan', 'NamXuatBan')}">
            </div>

            <div class="mb-3">
                <label class="form-label">Ảnh bìa</label>
                <input class="form-control" name="AnhBia"
                       value="${value('anhBia', 'AnhBia')}">
            </div>

            <div class="mb-3">
                <label class="form-label">Mô tả</label>
                <textarea class="form-control" name="MoTa"
                          rows="3">${value('moTa', 'MoTa')}</textarea>
            </div>

            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary"
                        onclick="closeModal()">
                    Hủy
                </button>

                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Cập nhật' : 'Thêm sách'}
                </button>
            </div>
        </form>
    `;

    // Dùng hàm mở modal hiện có trong project của bạn.
    function showModal(html) {
    let modalElement = document.getElementById('adminBookModal');

    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'adminBookModal';
        modalElement.className = 'modal fade';
        modalElement.tabIndex = -1;
        modalElement.setAttribute('aria-hidden', 'true');

        modalElement.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-body"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modalElement);
    }

    modalElement.querySelector('.modal-body').innerHTML = html;

    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.error('Bootstrap Modal chưa được tải.');
        notice('Không thể mở form: Bootstrap Modal chưa được tải.', 'error');
        return;
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function closeModal() {
    const modalElement = document.getElementById('adminBookModal');

    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const instance = bootstrap.Modal.getInstance(modalElement);

        if (instance) {
            instance.hide();
        }
    }
}

    document.getElementById('book-form')
    .addEventListener('submit', async function (event) {
        event.preventDefault();

        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');
        const formData = new FormData(form);

        const payload = {
            MaSach: isEdit ? Number(id) : 0,
            TenSach: formData.get('TenSach'),
            ISBN: formData.get('ISBN'),
            MaTheLoai: Number(formData.get('MaTheLoai')),
            TacGia: formData.get('TacGia'),
            NhaXuatBan: formData.get('NhaXuatBan'),
            Gia: Number(formData.get('Gia')),
            SoLuong: Number(formData.get('SoLuong')),
            NamXuatBan: formData.get('NamXuatBan')
                ? Number(formData.get('NamXuatBan'))
                : null,
            AnhBia: formData.get('AnhBia'),
            MoTa: formData.get('MoTa')
        };

        try {
            button.disabled = true;

            if (isEdit) {
                await request(`/sach/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    body: payload
                });

                notice('Cập nhật sách thành công!');
            } else {
                await request('/sach', {
                    method: 'POST',
                    body: payload
                });

                notice('Thêm sách thành công!');
            }

            closeModal();
            await loadBooks();
            renderBooks();

        } catch (error) {
            console.error('Lỗi lưu sách:', error);

            notice(
                error.message || 'Không thể lưu thông tin sách.',
                'error'
            );

            button.disabled = false;
        }
    });
    }   

            
    async function saveSimpleForm(type, item, payload, config) {
        try {
            await request(
                item
                    ? `${config.route}/${payload[config.key]}`
                    : config.route,
                {
                    method: item ? 'PUT' : 'POST',
                    body: payload
                }
            );

            closeModal();

            if (type === 'genre') {
                await loadGenres();
            } else if (type === 'author') {
                await loadAuthors();
            } else if (type === 'publisher') {
                await loadPublishers();
            }

            notice(
                item
                    ? `Đã cập nhật ${config.title}.`
                    : `Đã thêm ${config.title}.`
            );
        } catch (error) {
            notice(error.message, 'error');
        }
    }


    async function removeItem(type, id) {
        const configs = {
            book: {
                title: 'sách',
                list: state.books,
                idKeys: ['maSach', 'MaSach'],
                nameKeys: ['tenSach', 'TenSach'],
                route: '/sach',
                reload: loadBooks
            },
            genre: {
                title: 'thể loại',
                list: state.genres,
                idKeys: ['maTheLoai', 'MaTheLoai'],
                nameKeys: ['tenTheLoai', 'TenTheLoai'],
                route: '/the-loai',
                reload: loadGenres
            },
            author: {
                title: 'tác giả',
                list: state.authors,
                idKeys: ['maTacGia', 'MaTacGia'],
                nameKeys: ['tenTacGia', 'TenTacGia'],
                route: '/tac-gia',
                reload: loadAuthors
            },
            publisher: {
                title: 'nhà xuất bản',
                list: state.publishers,
                idKeys: ['maNhaXuatBan', 'MaNhaXuatBan'],
                nameKeys: ['tenNhaXuatBan', 'TenNhaXuatBan'],
                route: '/nha-xuat-ban',
                reload: loadPublishers
            }
        };

        const config = configs[type];

        if (!config) return;

        const item = config.list.find(record =>
            String(get(record, ...config.idKeys)) === String(id)
        );

        if (!item) {
            notice(`Không tìm thấy ${config.title} cần xóa.`, 'error');
            return;
        }

        const name = get(item, ...config.nameKeys) || id;

        if (!confirm(`Bạn có chắc muốn xóa ${config.title} "${name}" không?`)) {
            return;
        }

        try {
            await request(`${config.route}/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            await config.reload();
            notice(`Đã xóa ${config.title}.`);
        } catch (error) {
            notice(error.message, 'error');
        }
    }

    function openCustomerDetail(id) {
        const customer = state.customers.find(item =>
            String(get(item, 'maKhachHang', 'MaKhachHang')) === String(id)
        );

        if (!customer) {
            notice('Không tìm thấy khách hàng.', 'error');
            return;
        }

        openModal('Thông tin khách hàng', `
            <div class="detail-list">
                <div><span>Mã khách hàng</span><b>${esc(get(customer, 'maKhachHang', 'MaKhachHang') ?? '—')}</b></div>
                <div><span>Họ tên</span><b>${esc(get(customer, 'tenKhachHang', 'TenKhachHang') || '—')}</b></div>
                <div><span>Tên đăng nhập</span><b>${esc(get(customer, 'tenDangNhap', 'TenDangNhap') || '—')}</b></div>
                <div><span>Email</span><b>${esc(get(customer, 'email', 'Email') || '—')}</b></div>
                <div><span>Số điện thoại</span><b>${esc(get(customer, 'soDienThoai', 'SoDienThoai') || '—')}</b></div>
                <div><span>Địa chỉ</span><b>${esc(get(customer, 'diaChi', 'DiaChi') || '—')}</b></div>
                <div><span>Vai trò</span><b>${esc(get(customer, 'role', 'Role') || 'User')}</b></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary" id="cancelModal">Đóng</button>
            </div>
        `);

        $('#cancelModal').onclick = closeModal;
    }

    async function openOrderDetail(id) {
        try {
            const order = await request(`/hoa-don/${encodeURIComponent(id)}`);

            const details = Array.isArray(order)
                ? order
                : order?.chiTietHds ||
                  order?.ChiTietHds ||
                  order?.chiTietHoaDons ||
                  order?.ChiTietHoaDons ||
                  order?.data?.chiTietHds ||
                  order?.data?.ChiTietHds ||
                  [];

            const header = Array.isArray(order) ? {} : order;

            openModal(`Chi tiết hóa đơn #${id}`, `
                <div class="detail-list">
                    <div><span>Mã hóa đơn</span><b>${esc(get(header, 'maHoaDon', 'MaHoaDon') ?? id)}</b></div>
                    <div><span>Người nhận</span><b>${esc(get(header, 'tenNguoiNhan', 'TenNguoiNhan') || '—')}</b></div>
                    <div><span>Số điện thoại</span><b>${esc(get(header, 'soDienThoai', 'SoDienThoai') || '—')}</b></div>
                    <div><span>Địa chỉ</span><b>${esc(get(header, 'diaChi', 'DiaChi') || '—')}</b></div>
                    <div><span>Ngày lập</span><b>${date(get(header, 'ngayLap', 'NgayLap'))}</b></div>
                    <div><span>Tổng tiền</span><b>${money(get(header, 'tongTien', 'TongTien'))}</b></div>
                </div>
                <h3 style="margin:20px 0 10px">Sản phẩm trong hóa đơn</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsOrEmpty(
                                details.map(detail => `
                                    <tr>
                                        <td>${esc(
                                            get(detail, 'tenSach', 'TenSach') ||
                                            get(detail, 'maSach', 'MaSach') ||
                                            'Sản phẩm'
                                        )}</td>
                                        <td>${esc(get(detail, 'soLuong', 'SoLuong') ?? 0)}</td>
                                        <td>${money(get(detail, 'donGia', 'DonGia') ?? get(detail, 'gia', 'Gia'))}</td>
                                    </tr>
                                `),
                                3,
                                'Không có dữ liệu chi tiết sản phẩm.'
                            )}
                        </tbody>
                    </table>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" id="cancelModal">Đóng</button>
                </div>
            `);

            $('#cancelModal').onclick = closeModal;
        } catch (error) {
            notice(error.message, 'error');
        }
    }

    function openOrderForm(id) {
        const order = state.orders.find(item =>
            String(get(item, 'maHoaDon', 'MaHoaDon')) === String(id)
        );

        if (!order) {
            notice('Không tìm thấy hóa đơn cần sửa.', 'error');
            return;
        }

        openModal(`Cập nhật hóa đơn #${id}`, `
            <form id="orderForm">
                <div class="form-grid">
                    <label class="field">
                        <span>Tên người nhận</span>
                        <input name="tenNguoiNhan"
                            value="${esc(get(order, 'tenNguoiNhan', 'TenNguoiNhan') || '')}"
                            required>
                    </label>

                    <label class="field">
                        <span>Số điện thoại</span>
                        <input name="soDienThoai"
                            value="${esc(get(order, 'soDienThoai', 'SoDienThoai') || '')}"
                            required>
                    </label>

                    <label class="field full">
                        <span>Địa chỉ nhận hàng</span>
                        <input name="diaChi"
                            value="${esc(get(order, 'diaChi', 'DiaChi') || '')}"
                            required>
                    </label>

                    <label class="field full">
                        <span>Ghi chú</span>
                        <textarea name="ghiChu">${esc(get(order, 'ghiChu', 'GhiChu') || '')}</textarea>
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelModal">Hủy</button>
                    <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                </div>
            </form>
        `);

        $('#cancelModal').onclick = closeModal;

        $('#orderForm').onsubmit = async event => {
            event.preventDefault();

          
const form = new FormData(event.currentTarget);



const maTacGia = Number(form.get('maTacGia'));
const maTheLoai = Number(form.get('maTheLoai'));
const maNhaXuatBan = Number(form.get('maNhaXuatBan'));

const tacGia = state.authors.find(author =>
    Number(get(author, 'maTacGia', 'MaTacGia')) === maTacGia
);

const theLoai = state.genres.find(genre =>
    Number(get(genre, 'maTheLoai', 'MaTheLoai')) === maTheLoai
);

const nhaXuatBan = state.publishers.find(publisher =>
    Number(get(publisher, 'maNhaXuatBan', 'MaNhaXuatBan')) === maNhaXuatBan
);

const payload = {
    tenNguoiNhan: String(
        form.get('tenNguoiNhan') || ''
    ).trim(),

    soDienThoai: String(
        form.get('soDienThoai') || ''
    ).trim(),

    diaChi: String(
        form.get('diaChi') || ''
    ).trim(),

    ghiChu: String(
        form.get('ghiChu') || ''
    ).trim()
};

            try {
                await request(`/hoa-don/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    body: payload
                });

                closeModal();
                await loadOrders();
                notice('Đã cập nhật hóa đơn.');
            } catch (error) {
                notice(error.message, 'error');
            }
        };
    }

    async function togglePaid(id, currentPaid) {
        const nextPaid = !currentPaid;

        const message = nextPaid
            ? 'Xác nhận hóa đơn này đã thanh toán?'
            : 'Bạn có chắc muốn hủy xác nhận thanh toán?';

        if (!confirm(message)) return;

        try {
            await request(
                `/hoa-don/${encodeURIComponent(id)}/trang-thai-thanh-toan?trangThai=${nextPaid}`,
                {
                    method: 'PUT'
                }
            );

            await loadOrders();

            notice(
                nextPaid
                    ? 'Đã xác nhận thanh toán.'
                    : 'Đã hủy xác nhận thanh toán.'
            );
        } catch (error) {
            notice(error.message, 'error');
        }
    }

    async function deleteOrder(id) {
        const order = state.orders.find(item =>
            String(get(item, 'maHoaDon', 'MaHoaDon')) === String(id)
        );

        if (!order) {
            notice('Không tìm thấy hóa đơn cần xóa.', 'error');
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa hóa đơn #${id} không?`)) {
            return;
        }

        try {
            await request(`/hoa-don/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            await loadOrders();
            notice('Đã xóa hóa đơn.');
        } catch (error) {
            notice(error.message, 'error');
        }
    }

    function closeModal() {
        const backdrop = $('#modalBackdrop');

        if (backdrop) {
            backdrop.hidden = true;
        }
    }

    function openModal(title, html) {
        const backdrop = $('#modalBackdrop');

        if (!backdrop) {
            notice('Không tìm thấy vùng hiển thị biểu mẫu.', 'error');
            return;
        }

        $('#modalTitle').textContent = title;
        $('#modalBody').innerHTML = html;
        backdrop.hidden = false;
    }

    function getActionButton(action, id, extra = '') {
        return `
            <div class="action-group">
                <button type="button" class="text-btn"
                    data-action="${esc(action)}"
                    data-id="${esc(id)}">Sửa</button>
                <button type="button" class="text-btn danger"
                    data-action="${esc(action.replace('-edit', '-delete'))}"
                    data-id="${esc(id)}">Xóa</button>
                ${extra}
            </div>
        `;
    }

    document.addEventListener('click', async event => {
        const chatContact = event.target.closest('[data-chat-customer]');
        if (chatContact) {
            try {
                await openAdminChat(chatContact.dataset.chatCustomer);
            } catch (error) {
                notice(error.message || 'Không mở được cuộc trò chuyện.', 'error');
            }
            return;
        }

        const nav = event.target.closest('.nav-item[data-view]');

        if (nav) {
            event.preventDefault();
            showView(nav.dataset.view);
            return;
        }

        const goto = event.target.closest('[data-goto]');

        if (goto) {
            event.preventDefault();
            showView(goto.dataset.goto);
            return;
        }

        if (event.target.closest('#closeModal')) {
            closeModal();
            return;
        }

        if (event.target.id === 'modalBackdrop') {
            closeModal();
            return;
        }

        const actionButton = event.target.closest('[data-action]');

        if (actionButton) {
            const action = actionButton.dataset.action;
            const id = actionButton.dataset.id;

            try {
                switch (action) {
                    case 'book-edit':
                        openBookForm(id);
                        break;

                    case 'book-delete':
                        await removeItem('book', id);
                        break;

                    case 'genre-edit':
                        openSimpleForm('genre', id);
                        break;

                    case 'genre-delete':
                        await removeItem('genre', id);
                        break;

                    case 'author-edit':
                        openSimpleForm('author', id);
                        break;

                    case 'author-delete':
                        await removeItem('author', id);
                        break;

                    case 'publisher-edit':
                        openSimpleForm('publisher', id);
                        break;

                    case 'publisher-delete':
                        await removeItem('publisher', id);
                        break;

                    case 'customer-detail':
                        openCustomerDetail(id);
                        break;

                    case 'order-detail':
                        await openOrderDetail(id);
                        break;

                    case 'order-edit':
                        openOrderForm(id);
                        break;

                    case 'order-toggle':
                        await togglePaid(
                            id,
                            actionButton.dataset.paid === 'true'
                        );
                        break;

                    case 'order-delete':
                        await deleteOrder(id);
                        break;
                }
            } catch (error) {
                notice(error.message || 'Đã xảy ra lỗi.', 'error');
            }

            return;
        }

        if (event.target.closest('#addBookBtn')) {
            openBookForm();
            return;
        }

        if (event.target.closest('#addGenreBtn')) {
            openSimpleForm('genre');
            return;
        }

        if (event.target.closest('#addAuthorBtn')) {
            openSimpleForm('author');
            return;
        }

        if (event.target.closest('#addPublisherBtn')) {
            openSimpleForm('publisher');
            return;
        }

        if (
            event.target.closest('#refreshBtn') ||
            event.target.closest('#dashboardRefresh')
        ) {
            if (state.view === 'dashboard') {
                await loadDashboard();
            } else {
                await loadView(state.view);
            }
        }
    });

    $('#adminChatSendForm')?.addEventListener('submit', sendAdminChatMessage);
    $('#chatCustomerSearch')?.addEventListener('input', renderChatContacts);
    $('#refreshMessagesBtn')?.addEventListener('click', () => {
        loadChatContacts().catch(error => notice(error.message || 'Không tải được danh sách tin nhắn.', 'error'));
    });

    $('#bookSearch')?.addEventListener('input', renderBooks);
    $('#customerSearch')?.addEventListener('input', renderCustomers);
    $('#orderSearch')?.addEventListener('input', renderOrders);

    $('#mobileMenu')?.addEventListener('click', () => {
        $('#sidebar')?.classList.toggle('open');
    });

    $('#logoutBtn')?.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc muốn đăng xuất không?')) {
            return;
        }

        try {
            await request('/KhachHang/logout', {
                method: 'POST'
            });
        } catch (error) {
        }

        sessionStorage.removeItem('bookstore-admin-user');
        window.location.href = 'login.html';
    });

    async function initAdmin() {
        if (!requireAdmin()) return;

        const user = JSON.parse(
            sessionStorage.getItem('bookstore-admin-user') || '{}'
        );

        const name =
            user.tenKhachHang ||
            user.TenKhachHang ||
            user.tenDangNhap ||
            user.TenDangNhap ||
            user.username ||
            'Admin';

        if ($('#adminName')) {
            $('#adminName').textContent = name;
        }

        if ($('#welcomeName')) {
            $('#welcomeName').textContent = name;
        }

        showView('dashboard');
    }

    initAdmin().catch(error => {
        notice(error.message || 'Không thể khởi tạo trang quản trị.', 'error');
    });
})();
