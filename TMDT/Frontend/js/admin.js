
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
        view: 'dashboard'
    };

    const get = (obj, ...keys) => {
        for (const key of keys) {
            if (obj && obj[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return '';
    };

    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
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

    const PRESET_BOOK_IMAGES = [
        '1984.jpg',
        '2024_Nitro_Default_3840x2400.jpg',
        'bi-mat-tu-duy-trieu-phu.jpg',
        'cha-giau-cha-ngheo.jpg',
        'chi-pheo.jpg',
        'day-con-lam-giau.jpg',
        'de-men-phieu-luu-ky.jpg',
        'dracula.jpg',
        'dune.jpg',
        'enders-game.jpg',
        'frankenstein.jpg',
        'it.jpg',
        'khoi-nghiep-tinh-gon.jpg',
        'lao-hac.jpg',
        'pet-sematary.jpg',
        'quoc-gia-khoi-nghiep.jpg',
        'so-do.jpg',
        'tam-the.jpg',
        'tat-den.jpg',
        'the-martian.jpg',
        'the-shining.jpg'
    ];

    const resolveBookImage = image => {
        if (!image || !String(image).trim()) return 'image/ThuVien.jpg';
        const path = String(image).trim();
        if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
        if (path.startsWith('image/')) return path;
        return 'image/Sach/' + path.replace(/^\/+/, '');
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

        const authId = state.user?.maKhachHang ?? state.user?.MaKhachHang ?? state.user?.id ?? '';
        const authRole = state.user?.role ?? state.user?.Role ?? '';

        try {
            response = await fetch(API + path, {
                ...options,
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    ...(authId ? { 'X-User-Id': String(authId) } : {}),
                    ...(authRole ? { 'X-User-Role': String(authRole) } : {}),
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
        try {
            state.user = JSON.parse(
                sessionStorage.getItem('bookstore-admin-user') ||
                sessionStorage.getItem('apiq-user') ||
                localStorage.getItem('bookstore-user') ||
                'null'
            );
        } catch {
            state.user = null;
        }

        const role = get(state.user, 'role', 'Role');

        if (!state.user) {
            location.replace('login.html');
            return false;
        }

        if (String(role).toLowerCase() !== 'admin') {
            alert('Tài khoản của bạn không có quyền Quản trị (Admin). Hệ thống sẽ chuyển bạn về trang Cửa hàng.');
            location.replace('shop.html');
            return false;
        }

        const name =
            get(state.user, 'tenKhachHang', 'TenKhachHang') ||
            get(state.user, 'userName', 'UserName') ||
            get(state.user, 'tenDangNhap', 'TenDangNhap') ||
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
                                ? `<img class="book-cover" src="${esc(resolveBookImage(image))}" alt="" onerror="this.onerror=null;this.src='image/ThuVien.jpg'">`
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
                    <td>${act('book', bookId)}</td>
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
                const paid = Boolean(
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
                const paid = Boolean(
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
                    Boolean(get(item, 'trangThaiThanhToan', 'TrangThaiThanhToan'))
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
            'orders'
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
            orders: 'Quản lý hóa đơn'
        };

        if ($('#pageTitle')) {
            $('#pageTitle').textContent = labels[name] || 'Quản trị';
        }

        $('#sidebar')?.classList.remove('open');

        if (name === 'dashboard') {
            loadDashboard().catch(error => notice(error.message, 'error'));
        } else {
            loadView(name).catch(error => notice(error.message, 'error'));
        }
    }

    async function openBookForm(id = null) {
        if (!state.genres.length || !state.authors.length || !state.publishers.length) {
            await Promise.all([
                loadGenres().catch(() => {}),
                loadAuthors().catch(() => {}),
                loadPublishers().catch(() => {})
            ]);
        }

        const item = id == null
            ? null
            : state.books.find(book =>
                String(get(book, 'maSach', 'MaSach')) === String(id)
            );

        if (id != null && !item) {
            notice('Không tìm thấy sách cần sửa.', 'error');
            return;
        }

        const value = (lower, upper, fallback = '') =>
            get(item || {}, lower, upper) ?? fallback;

        const currentRawImage = value('anhBia', 'AnhBia', '');
        let cleanImageName = String(currentRawImage || '')
            .replace(/^https?:\/\/[^/]+\//i, '')
            .replace(/^image\/[sS]ach\//i, '')
            .replace(/^\/+/, '');

        const isPreset = PRESET_BOOK_IMAGES.includes(cleanImageName) || (!cleanImageName && id == null);
        const initialSelectedImage = cleanImageName || (id == null ? PRESET_BOOK_IMAGES[0] : '');

        const genreOptions = state.genres.map(genre => {
            const genreId = get(genre, 'maTheLoai', 'MaTheLoai');
            const genreName = get(genre, 'tenTheLoai', 'TenTheLoai');

            return `
                <option value="${esc(genreId)}"
                    ${String(value('maTheLoai', 'MaTheLoai')) === String(genreId) ? 'selected' : ''}>
                    ${esc(genreName)}
                </option>
            `;
        }).join('');

        const authorOptions = state.authors.map(author => {
            const authorId = get(author, 'maTacGia', 'MaTacGia');
            const authorName = get(author, 'tenTacGia', 'TenTacGia');

            return `
                <option value="${esc(authorId)}"
                    ${String(value('maTacGia', 'MaTacGia')) === String(authorId) ? 'selected' : ''}>
                    ${esc(authorName)}
                </option>
            `;
        }).join('');

        const publisherOptions = state.publishers.map(publisher => {
            const publisherId = get(publisher, 'maNhaXuatBan', 'MaNhaXuatBan');
            const publisherName = get(publisher, 'tenNhaXuatBan', 'TenNhaXuatBan');

            return `
                <option value="${esc(publisherId)}"
                    ${String(value('maNhaXuatBan', 'MaNhaXuatBan')) === String(publisherId) ? 'selected' : ''}>
                    ${esc(publisherName)}
                </option>
            `;
        }).join('');

        openModal(id == null ? 'Thêm sách mới' : 'Sửa thông tin sách', `
            <form id="bookForm">
                <div class="form-grid">
                    <label class="field full">
                        <span>Tên sách *</span>
                        <input name="tenSach"
                            value="${esc(value('tenSach', 'TenSach'))}"
                            placeholder="Nhập tên sách..."
                            required>
                    </label>

                    <label class="field">
                        <span>Thể loại *</span>
                        <select name="maTheLoai" required>
                            <option value="">-- Chọn thể loại --</option>
                            ${genreOptions}
                        </select>
                    </label>

                    <label class="field">
                        <span>Tác giả *</span>
                        <select name="maTacGia" required>
                            <option value="">-- Chọn tác giả --</option>
                            ${authorOptions}
                        </select>
                    </label>

                    <label class="field">
                        <span>Nhà xuất bản *</span>
                        <select name="maNhaXuatBan" required>
                            <option value="">-- Chọn nhà xuất bản --</option>
                            ${publisherOptions}
                        </select>
                    </label>

                    <label class="field">
                        <span>Giá bán (VNĐ) *</span>
                        <input name="donGia" type="number" min="0" step="1000"
                            value="${esc(value('donGia', 'DonGia', value('gia', 'Gia', 0)))}"
                            placeholder="Ví dụ: 120000"
                            required>
                    </label>

                    <!-- Khối chọn ảnh bìa sách -->
                    <div class="field full image-selector-container">
                        <label class="fw-bold text-secondary mb-2" style="font-size: 13px; display: block;">
                            Ảnh bìa sách *
                        </label>

                        <div class="image-source-tabs">
                            <label class="source-option">
                                <input type="radio" name="imageSource" value="preset" ${isPreset ? 'checked' : ''}>
                                <span>📁 Chọn ảnh có sẵn trong mục image/sach</span>
                            </label>
                            <label class="source-option">
                                <input type="radio" name="imageSource" value="upload" ${!isPreset && cleanImageName ? 'checked' : ''}>
                                <span>💻 Tải ảnh từ thiết bị lên</span>
                            </label>
                        </div>

                        <!-- Khối 1: Chọn ảnh có sẵn -->
                        <div id="presetImageSection" style="${isPreset ? '' : 'display: none;'}">
                            <label class="form-label small text-muted mb-1 d-block">Danh sách ảnh trong thư mục image/sach:</label>
                            <select id="presetImageSelect" class="form-control mb-2" style="padding: 8px 12px; font-size: 13px; border-radius: 8px;">
                                <option value="">-- Chọn ảnh từ thư mục image/sach --</option>
                                ${PRESET_BOOK_IMAGES.map(img => `
                                    <option value="${esc(img)}" ${cleanImageName === img || (!cleanImageName && img === initialSelectedImage) ? 'selected' : ''}>
                                        ${esc(img)}
                                    </option>
                                `).join('')}
                            </select>

                            <div class="preset-thumbs-grid mb-1">
                                ${PRESET_BOOK_IMAGES.map(img => `
                                    <div class="thumb-item ${cleanImageName === img || (!cleanImageName && img === initialSelectedImage) ? 'active' : ''}"
                                         data-img="${esc(img)}"
                                         title="${esc(img)}">
                                        <img src="image/Sach/${esc(img)}"
                                             style="width: 52px; height: 68px; object-fit: cover; border-radius: 5px; border: 2px solid ${cleanImageName === img || (!cleanImageName && img === initialSelectedImage) ? 'var(--purple, #6750a4)' : '#e2e4e9'};"
                                             onerror="this.onerror=null;this.src='image/ThuVien.jpg';">
                                    </div>
                                `).join('')}
                            </div>
                            <small class="text-muted d-block mt-1">Nhấp vào một ảnh ở trên để chọn nhanh.</small>
                        </div>

                        <!-- Khối 2: Tải ảnh từ thiết bị -->
                        <div id="uploadImageSection" style="${!isPreset && cleanImageName ? '' : 'display: none;'}">
                            <label class="form-label small text-muted mb-1 d-block">Chọn file ảnh từ thiết bị của bạn:</label>
                            <input type="file" id="bookImageFile" class="form-control" accept="image/*" style="padding: 8px 10px; border-radius: 8px;">
                            <small class="text-muted d-block mt-1">Chấp nhận file: .jpg, .jpeg, .png, .gif, .webp</small>
                        </div>

                        <input type="hidden" name="anhBia" id="finalBookImage" value="${esc(initialSelectedImage)}">

                        <!-- Khung xem trước ảnh bìa -->
                        <div class="image-preview-box mt-3">
                            <img id="bookImagePreview"
                                 src="${initialSelectedImage ? resolveBookImage(initialSelectedImage) : 'image/ThuVien.jpg'}"
                                 alt="Xem trước ảnh bìa"
                                 style="width: 60px; height: 80px; object-fit: contain; border-radius: 6px; background: #fff; border: 1px solid #ddd;"
                                 onerror="this.onerror=null;this.src='image/ThuVien.jpg';">
                            <div>
                                <span class="d-block fw-bold text-dark" style="font-size: 12px;">Ảnh bìa đã chọn:</span>
                                <span id="bookImageNameText" class="text-muted small" style="word-break: break-all;">
                                    ${esc(initialSelectedImage || 'Chưa chọn ảnh')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <label class="field full">
                        <span>Mô tả</span>
                        <textarea name="moTa" placeholder="Nhập mô tả tóm tắt về cuốn sách...">${esc(value('moTa', 'MoTa'))}</textarea>
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelModal">Hủy</button>
                    <button type="submit" class="btn btn-primary">
                        ${id == null ? 'Thêm sách' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        `);

        $('#cancelModal').onclick = closeModal;

        // Xử lý logic chọn ảnh trong modal
        const finalImgInput = $('#finalBookImage');
        const previewImg = $('#bookImagePreview');
        const previewName = $('#bookImageNameText');
        const presetSection = $('#presetImageSection');
        const uploadSection = $('#uploadImageSection');
        const presetSelect = $('#presetImageSelect');
        const fileInput = $('#bookImageFile');
        const sourceRadios = $$('input[name="imageSource"]');
        const thumbs = $$('.preset-thumbs-grid .thumb-item');

        const updateSelectedPreset = imgName => {
            if (!imgName) return;
            finalImgInput.value = imgName;
            if (presetSelect) presetSelect.value = imgName;
            if (previewImg) previewImg.src = resolveBookImage(imgName);
            if (previewName) previewName.textContent = imgName + ' (trong mục image/sach)';
            thumbs.forEach(t => {
                const match = t.dataset.img === imgName;
                t.classList.toggle('active', match);
                const imgEl = t.querySelector('img');
                if (imgEl) {
                    imgEl.style.borderColor = match ? 'var(--purple, #6750a4)' : '#e2e4e9';
                }
            });
        };

        sourceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'preset') {
                    presetSection.style.display = 'block';
                    uploadSection.style.display = 'none';
                    if (presetSelect && presetSelect.value) {
                        updateSelectedPreset(presetSelect.value);
                    }
                } else {
                    presetSection.style.display = 'none';
                    uploadSection.style.display = 'block';
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        finalImgInput.value = fileInput.files[0].name;
                        if (previewName) previewName.textContent = fileInput.files[0].name + ' (tải từ thiết bị)';
                    }
                }
            });
        });

        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                updateSelectedPreset(presetSelect.value);
            });
        }

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                updateSelectedPreset(thumb.dataset.img);
            });
        });

        if (fileInput) {
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (file) {
                    finalImgInput.value = file.name;
                    if (previewName) previewName.textContent = file.name + ' (tải từ thiết bị)';
                    const reader = new FileReader();
                    reader.onload = ev => {
                        if (previewImg) previewImg.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        $('#bookForm').onsubmit = async event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const maTacGia = Number(form.get('maTacGia'));
            const maTheLoai = Number(form.get('maTheLoai'));
            const maNhaXuatBan = Number(form.get('maNhaXuatBan'));
            const donGia = Number(form.get('donGia'));
            let finalImg = (finalImgInput.value || '').trim();

            // Kiểm tra các trường khóa ngoại bắt buộc
            if (!maTheLoai || isNaN(maTheLoai) || maTheLoai <= 0) {
                notice('Vui lòng chọn Thể loại cho sách.', 'error');
                return;
            }
            if (!maTacGia || isNaN(maTacGia) || maTacGia <= 0) {
                notice('Vui lòng chọn Tác giả cho sách.', 'error');
                return;
            }
            if (!maNhaXuatBan || isNaN(maNhaXuatBan) || maNhaXuatBan <= 0) {
                notice('Vui lòng chọn Nhà xuất bản cho sách.', 'error');
                return;
            }
            if (isNaN(donGia) || donGia < 0) {
                notice('Vui lòng nhập giá sách hợp lệ (từ 0 trở lên).', 'error');
                return;
            }

            const isUploadSource = form.get('imageSource') === 'upload';
            const uploadFile = fileInput?.files?.[0];

            // Nếu người dùng chọn tải ảnh từ thiết bị và có chọn tệp
            if (isUploadSource && uploadFile) {
                try {
                    const fd = new FormData();
                    fd.append('file', uploadFile);
                    const authId = state.user?.maKhachHang ?? state.user?.MaKhachHang ?? state.user?.id ?? '';
                    const authRole = state.user?.role ?? state.user?.Role ?? '';

                    const uploadRes = await fetch(`${API}/sach/upload-image`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            ...(authId ? { 'X-User-Id': String(authId) } : {}),
                            ...(authRole ? { 'X-User-Role': String(authRole) } : {})
                        },
                        body: fd
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadRes.ok || !uploadData.fileName) {
                        throw new Error(uploadData.message || 'Không thể tải ảnh lên máy chủ.');
                    }
                    finalImg = uploadData.fileName;
                } catch (err) {
                    notice('Lỗi tải ảnh từ thiết bị: ' + err.message, 'error');
                    return;
                }
            }

            if (!finalImg) {
                notice('Vui lòng chọn ảnh bìa từ danh sách hoặc tải ảnh từ thiết bị lên.', 'error');
                return;
            }

            const payload = {
                tenSach: String(form.get('tenSach') || '').trim(),
                anhBia: finalImg,
                maTacGia: maTacGia,
                gia: donGia,
                maTheLoai: maTheLoai,
                maNhaXuatBan: maNhaXuatBan,
                isdelete: false
            };

            if (id != null) {
                payload.maSach = Number(id);
            }

            try {
                const route = id == null
                    ? '/sach'
                    : `/sach/${encodeURIComponent(id)}`;

                await request(route, {
                    method: id == null ? 'POST' : 'PUT',
                    body: payload
                });

                closeModal();
                await loadBooks();
                notice(id == null ? 'Đã thêm sách thành công.' : 'Đã cập nhật sách thành công.');
            } catch (error) {
                console.error('Lỗi lưu sách:', error);
                notice(error.message || 'Không thể lưu thông tin sách.', 'error');
            }
        };
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
    tenSach: String(form.get('tenSach') || '').trim(),
    maTacGia,
    anhBia: String(form.get('hinh') || '').trim(),
    gia: Number(form.get('donGia')),
    maTheLoai,
    maNhaXuatBan,
    isdelete: false,
    maTacGiaNavigation: tacGia,
    maTheLoaiNavigation: theLoai,
    maNhaXuatBanNavigation: nhaXuatBan
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
