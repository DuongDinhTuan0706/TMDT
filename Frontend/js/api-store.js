/* Frontend API integration for APIq. Configure API_ROOT in localStorage if needed. */
(() => {
    'use strict';
    const API_ROOT =
        (localStorage.getItem('API_ROOT') ||
            'https://localhost:7091').replace(/\/$/, '');

    const API = API_ROOT + '/api';
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const state = { user: null, books: [], cart: [] }; let editingReviewId = null;
    const money = n => Number(n || 0).toLocaleString('vi-VN') + ' ₫';
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const unwrap = d => d?.data ?? d?.result ?? d?.items ?? d;

    async function request(path, options = {}) {
        const url = API + path;

        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                ...(options.body ? {
                    'Content-Type': 'application/json'
                } : {}),
                ...options.headers
            },
            body: options.body && typeof options.body !== 'string'
                ? JSON.stringify(options.body)
                : options.body
        });

        const text = await response.text();

        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.Message ||
                data?.title ||
                `HTTP ${response.status}`
            );
        }

        return data;
    }

    function notice(message, type = 'success') {
        let box = $('#api-toast'); if (!box) { box = document.createElement('div'); box.id = 'api-toast'; box.style.cssText = 'position:fixed;right:20px;top:20px;z-index:99999;max-width:380px;padding:14px 18px;border-radius:8px;color:#fff;box-shadow:0 5px 24px #0002'; document.body.append(box); }
        box.style.background = type === 'error' ? '#b02a37' : '#198754'; box.textContent = message; box.hidden = false; clearTimeout(box._timer); box._timer = setTimeout(() => box.hidden = true, 4000);
    }
    function isUserLoggedIn() {
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken');

        const user =
            localStorage.getItem('currentUser') ||
            localStorage.getItem('user');

        return !!(token || user);
    }

    function requireLogin() {
        alert('Vui lòng đăng nhập để tiếp tục!');
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
    }
    function getUser() {
        try {
            const raw = sessionStorage.getItem('apiq-user')
                || localStorage.getItem('bookstore-user')
                || sessionStorage.getItem('bookstore-admin-user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function isUserLoggedIn() {
        const user = getUser();
        return !!(user && (user.maKhachHang || user.MaKhachHang || user.id || user.Id));
    }

    function setUser(u) {
        state.user = u;
        if (u) {
            sessionStorage.setItem('apiq-user', JSON.stringify(u));
            localStorage.setItem('bookstore-user', JSON.stringify(u));
            if (String(u.role || u.Role || '').toLowerCase() === 'admin') {
                sessionStorage.setItem('bookstore-admin-user', JSON.stringify(u));
            }
        } else {
            sessionStorage.removeItem('apiq-user');
            localStorage.removeItem('bookstore-user');
            sessionStorage.removeItem('bookstore-admin-user');
        }
        updateNav();
    }
    function idOf(u = state.user) { return u?.maKhachHang ?? u?.MaKhachHang ?? u?.id ?? u?.Id; }
    function isVerified(u = state.user) { return u?.isVerified ?? u?.IsVerified ?? false; }
    function bookId(b) { return b?.maSach ?? b?.MaSach ?? b?.id; }
    function bookTitle(b) { return b?.tenSach ?? b?.TenSach ?? b?.title ?? 'Sách'; }
    function bookPrice(b) { return b?.gia ?? b?.Gia ?? b?.price ?? 0; }
    function bookImage(book) {
        const image =
            book?.anhBia ??
            book?.AnhBia ??
            book?.hinhAnh ??
            book?.HinhAnh ??
            '';

        if (!image || !String(image).trim()) {
            return 'image/giohang.jpg';
        }

        const path = String(image).trim();

        // Nếu API trả về đường dẫn đầy đủ
        if (/^https?:\/\//i.test(path)) {
            return path;
        }

        // Nếu đã có đường dẫn thư mục
        if (path.startsWith('image/')) {
            return path;
        }

        // Ảnh bìa sách nằm trong image/sach/
        return 'image/sach/' + path.replace(/^\/+/, '');
    }

    function updateNav() {
        const nav = $('#navbarCollapse .navbar-nav'); if (!nav) return;
        if (!$('#api-account-nav', nav)) { const wrap = document.createElement('div'); wrap.id = 'api-account-nav'; wrap.className = 'd-flex align-items-center flex-wrap gap-2 ms-lg-3 py-2'; nav.append(wrap); }
        const wrap = $('#api-account-nav', nav); const u = getUser();
        const isAdmin = u && String(u.role || u.Role || '').toLowerCase() === 'admin';
        wrap.innerHTML = u
            ? `<span class="small text-white me-1">Xin chào, ${esc(u.tenKhachHang || u.TenKhachHang || u.email || u.Email || 'Khách hàng')}</span>`
            + (isAdmin ? `<a class="btn btn-nav-account rounded-pill btn-sm" href="admin.html">Quản trị</a>` : '')
            + `<a class="btn btn-nav-account rounded-pill btn-sm" href="profile.html">Tài khoản</a><a class="btn btn-nav-account rounded-pill btn-sm" href="favorites.html">Yêu thích</a><a class="btn btn-nav-account rounded-pill btn-sm" href="orders.html">Đơn mua</a><button class="btn btn-nav-logout rounded-pill btn-sm" id="api-logout">Đăng xuất</button>`
            : `<a class="btn btn-nav-account rounded-pill btn-sm" href="login.html">Đăng nhập</a><a class="btn btn-nav-register rounded-pill btn-sm" href="register.html">Đăng ký</a>`;
        $('#api-logout')?.addEventListener('click', async () => { try { await request('/KhachHang/logout', { method: 'POST' }); } catch (e) { } setUser(null); notice('Đã đăng xuất'); setTimeout(() => location.href = 'index.html', 500); });
    }

    async function loadBooks() {
        try {
            const d = await request('/sach');
            const data = unwrap(d);

            state.books = Array.isArray(data) ? data : [];

            // THÊM DÒNG NÀY ĐỂ KIỂM TRA
            console.log('Dữ liệu sách API trả về:', state.books[0]);

            bindBookSearch();
            renderBookGrids();
        } catch (e) {
            console.warn('Không tải được sách:', e);

            const el = $('#api-book-status');
            if (el) {
                el.textContent =
                    'Chưa kết nối được API sách. Kiểm tra API_ROOT và CORS.';
            }
        }
    }


    function card(b) {
        const id = bookId(b);

        return `
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
            <div class="product-item api-book-card rounded h-100 border">
                <div class="product-item-inner border-0 rounded">
                    <div class="product-item-inner-item">
                        <a href="book.html?id=${encodeURIComponent(id)}">
                            <img
                                src="${esc(bookImage(b))}"
                                class="img-fluid w-100 rounded-top"
                                style="height:260px;object-fit:contain;background:#fff"
                                alt="${esc(bookTitle(b))}"
                                onerror="this.onerror=null;this.src='image/ThuVien.jpg'"
                            >
                        </a>
                    </div>

                    <div class="text-center p-3 api-book-info">
                        <h6 class="text-truncate">
                            <a class="text-dark"
                               href="book.html?id=${encodeURIComponent(id)}">
                                ${esc(bookTitle(b))}
                            </a>
                        </h6>

                        <div class="text-primary fw-bold mb-3">
                            ${money(bookPrice(b))}
                        </div>

                        <button
                            class="btn btn-primary rounded-pill px-3 me-1"
                            data-add-cart="${esc(id)}">
                            <i class="fas fa-shopping-cart me-1"></i>
                            Thêm giỏ
                        </button>

                        <button
                            class="btn btn-outline-danger rounded-pill px-3"
                            data-favorite="${esc(id)}"
                            title="Yêu thích">
                            ♡
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }



    function getCategoryId(item) {
        const category = item?.maTheLoaiNavigation
            ?? item?.MaTheLoaiNavigation
            ?? item?.theLoai
            ?? item?.TheLoai
            ?? item?.theLoaiSach
            ?? item?.TheLoaiSach;

        return (
            item?.maTheLoai ??
            item?.MaTheLoai ??
            item?.theLoaiId ??
            item?.TheLoaiId ??
            item?.idTheLoai ??
            item?.IdTheLoai ??
            category?.maTheLoai ??
            category?.MaTheLoai ??
            category?.theLoaiId ??
            category?.TheLoaiId ??
            category?.id ??
            category?.Id ??
            null
        );
    }
    function getCategoryId(book) {
        return book.MaTheLoai ?? book.maTheLoai ?? null;
    }

    function getCategoryName(item) {
        return String(
            item?.tenTheLoai ??
            item?.TenTheLoai ??
            item?.maTheLoaiNavigation?.tenTheLoai ??
            item?.MaTheLoaiNavigation?.TenTheLoai ??
            item?.theLoai?.tenTheLoai ??
            item?.TheLoai?.TenTheLoai ??
            item?.theLoaiSach?.tenTheLoai ??
            item?.TheLoaiSach?.TenTheLoai ??
            ''
        ).trim().toLocaleLowerCase('vi');
    }

    async function loadBookCategories() {
        const container = document.getElementById('api-book-categories');
        if (!container) return;

        try {
            const result = await request('/TheLoai');
            const categories = unwrap(result);

            if (!Array.isArray(categories)) {
                console.error('Dữ liệu thể loại không hợp lệ:', result);
                return;
            }


            const searchCategorySelect =
                document.getElementById('search-book-category');

            if (searchCategorySelect) {
                searchCategorySelect.innerHTML = `
            <option value="">Tất cả thể loại</option>
            ${categories.map(item => {
                    const id = item.maTheLoai ?? item.MaTheLoai
                        ?? item.id ?? item.Id;

                    const name = item.tenTheLoai ?? item.TenTheLoai;

                    if (id == null || !name) return '';

                    return `
                    <option value="${esc(String(id))}">
                        ${esc(String(name))}
                    </option>
                `;
                }).join('')}
        `;

                const params = new URLSearchParams(window.location.search);
                searchCategorySelect.value = params.get('loai') || '';
            }


            const books = Array.isArray(state.books) ? state.books : [];

            const allItem = `
            <li>
                <div class="categories-item">
                    <a href="shop.html" class="text-dark"
                       data-category="">
                        <i class="fas fa-book text-danger me-2"></i>
                        Tất cả sách
                    </a>
                    <span>(${books.length})</span>
                </div>
            </li>`;

            const categoryItems = categories.map(category => {
                const id = category.maTheLoai ?? category.MaTheLoai
                    ?? category.id ?? category.Id;

                const name = category.tenTheLoai ?? category.TenTheLoai;

                if (id == null || !name) return '';

                const categoryName = String(name).trim().toLowerCase();

                const count = books.filter(book => {
                    const bookId = getCategoryId(book);

                    // Ưu tiên so sánh mã thể loại.
                    if (bookId != null) {
                        return String(bookId) === String(id);
                    }

                    // Nếu API chỉ trả tên thể loại, so sánh theo tên.
                    return getCategoryName(book) === categoryName;
                }).length;

                return `
                <li>
                    <div class="categories-item">
                        <a href="shop.html?loai=${encodeURIComponent(id)}"
                           class="text-dark"
                           data-category="${id}">
                            <i class="fas fa-book-open text-danger me-2"></i>
                            ${esc(name)}
                        </a>
                        <span>(${count})</span>
                    </div>
                </li>`;
            }).join('');

            container.innerHTML = allItem + categoryItems;


            container.querySelectorAll('[data-category]').forEach(link => {
                link.addEventListener('click', event => {
                    event.preventDefault();

                    const categoryId = link.dataset.category || '';

                    // Cập nhật thể loại đang chọn
                    state.category = categoryId;

                    // Chuyển về trang đầu tiên
                    currentBookPage = 1;

                    // Đồng bộ với URL để không giữ mã thể loại cũ
                    const url = new URL(window.location.href);

                    if (categoryId) {
                        url.searchParams.set('loai', categoryId);
                    } else {
                        url.searchParams.delete('loai');
                    }

                    history.replaceState({}, '', url);

                    // Đồng bộ với ô chọn thể loại nếu có
                    const categorySelect = document.getElementById('api-book-category');
                    if (categorySelect) {
                        categorySelect.value = categoryId;
                    }

                    renderBookGrids();
                });
            });

        } catch (error) {
            console.error('Lỗi tải thể loại:', error);
            container.innerHTML = `
            <li class="text-danger">
                Không tải được danh sách thể loại sách.
            </li>`;
        }
    }
    function setupPriceFilter() {
        const range = document.getElementById('rangeInput');
        const amount = document.getElementById('amount');
        const resetButton = document.getElementById('reset-price-filter');

        if (!range) return;

        function formatPrice(value) {
            return Number(value).toLocaleString('vi-VN') + 'đ';
        }

        function updatePriceFilter() {
            if (amount) {
                amount.textContent = formatPrice(range.value);
            }

            // Đưa trang cửa hàng về trang đầu khi thay đổi giá
            if (typeof currentBookPage !== 'undefined') {
                currentBookPage = 1;
            }

            renderBookGrids();
        }

        range.addEventListener('input', updatePriceFilter);

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                range.value = range.max;
                updatePriceFilter();
            });
        }

        updatePriceFilter();
    }

    let currentBookPage = 1;
    const BOOKS_PER_PAGE = 12;
    const MAX_VISIBLE_PAGES = 5;


    function renderBookGrids() {
        const search =
            document.getElementById('api-book-search') ||
            document.getElementById('search-book-name');

        const sort = $('#book-sort');
        const params = new URLSearchParams(window.location.search);

        // Nhận cả hai tên tham số URL
        const urlKeyword =
            params.get('keyword') ||
            params.get('q') ||
            '';

        // Ưu tiên từ khóa trên URL khi vừa chuyển từ trang chủ sang Shop
        const keyword = (
            urlKeyword ||
            search?.value?.trim() ||
            ''
        ).toLocaleLowerCase('vi');

        // Đọc đúng mã thể loại từ URL hoặc dropdown
        const categorySelect =
            document.getElementById('search-book-category') ||
            document.getElementById('api-book-category');

        const category =
            params.get('loai') ||
            categorySelect?.value ||
            state.category ||
            '';

        const sortType = sort ? sort.value : 'default';


        function getCategoryId(item) {
            const category =
                item?.maTheLoaiNavigation ??
                item?.MaTheLoaiNavigation ??
                item?.theLoai ??
                item?.TheLoai ??
                item?.theLoaiSach ??
                item?.TheLoaiSach;

            return (
                item?.maTheLoai ??
                item?.MaTheLoai ??
                item?.theLoaiId ??
                item?.TheLoaiId ??
                item?.idTheLoai ??
                item?.IdTheLoai ??
                category?.maTheLoai ??
                category?.MaTheLoai ??
                category?.theLoaiId ??
                category?.TheLoaiId ??
                category?.id ??
                category?.Id ??
                null
            );
        }

        const getPrice = book =>
            Number(book.gia ?? book.Gia ?? book.price ?? 0);

        const getQuantity = book =>
            Number(book.soLuong ?? book.SoLuong ?? book.quantity ?? 0);

        const getYear = book =>
            Number(book.namXuatBan ?? book.NamXuatBan ?? book.year ?? 0);

        // 1. Lọc sách
        let books = (state.books || []).filter(book => {
            const title = String(bookTitle(book) || '')
                .trim()
                .toLocaleLowerCase('vi');

            const matchesKeyword =
                !keyword || title.includes(keyword);

            const bookCategoryId = getCategoryId(book);
            const bookCategoryName = getCategoryName(book);

            const selectedCategory = (
                document.querySelector(
                    '#api-book-categories [data-category="' + category + '"]'
                )?.textContent || ''
            ).trim().toLocaleLowerCase('vi');

            const matchesCategory =
                !category ||
                (
                    bookCategoryId != null &&
                    String(bookCategoryId) === String(category)
                ) ||
                (
                    bookCategoryName !== '' &&
                    selectedCategory !== '' &&
                    bookCategoryName.includes(selectedCategory)
                );

            console.log({
                tenSach: bookTitle(book),
                maTheLoaiSach: bookCategoryId,
                maTheLoaiDangChon: category,
                matchesKeyword,
                matchesCategory
            });

            return matchesKeyword && matchesCategory;
        });

        // 2. Sắp xếp
        switch (sortType) {
            case 'name-asc':
                books.sort((a, b) =>
                    String(bookTitle(a)).localeCompare(
                        String(bookTitle(b)), 'vi'
                    )
                );
                break;

            case 'name-desc':
                books.sort((a, b) =>
                    String(bookTitle(b)).localeCompare(
                        String(bookTitle(a)), 'vi'
                    )
                );
                break;

            case 'price-asc':
                books.sort((a, b) => getPrice(a) - getPrice(b));
                break;

            case 'price-desc':
                books.sort((a, b) => getPrice(b) - getPrice(a));
                break;

            case 'quantity-desc':
                books.sort((a, b) => getQuantity(b) - getQuantity(a));
                break;

            case 'year-desc':
                books.sort((a, b) => getYear(b) - getYear(a));
                break;
        }

        // 3. Tính phân trang
        const totalBooks = books.length;
        const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);

        if (totalPages === 0) {
            currentBookPage = 1;
        } else {
            currentBookPage = Math.max(
                1,
                Math.min(currentBookPage, totalPages)
            );
        }

        const startIndex = (currentBookPage - 1) * BOOKS_PER_PAGE;
        const pageBooks = books.slice(
            startIndex,
            startIndex + BOOKS_PER_PAGE
        );

        // 4. Trang chủ: giữ cách hiển thị 8 sách
        const homeEl = $('#api-books-home');

        if (homeEl) {
            const homeBooks = keyword || category
                ? books.slice(0, 8)
                : books.slice(0, 8);

            homeEl.innerHTML = homeBooks.length
                ? homeBooks.map(card).join('')
                : '<p class="text-muted">Không tìm thấy sách phù hợp.</p>';
        }

        // 5. Hiển thị sách của trang hiện tại trong shop.html
        const gridEl = $('#api-books-grid');

        if (gridEl) {
            gridEl.innerHTML = pageBooks.length
                ? pageBooks.map(card).join('')
                : `<div class="col-12">
                 <p class="text-muted">Không tìm thấy sách phù hợp.</p>
               </div>`;

            // Tạo vùng phân trang nếu chưa có
            let pagination = $('#api-book-pagination');

            if (!pagination) {
                pagination = document.createElement('nav');
                pagination.id = 'api-book-pagination';
                pagination.setAttribute('aria-label', 'Phân trang sách');
                gridEl.insertAdjacentElement('afterend', pagination);
            }

            // Tạo tối đa 5 số trang
            let paginationHTML = '';

            if (totalPages > 1) {
                let startPage = Math.max(
                    1,
                    currentBookPage - Math.floor(MAX_VISIBLE_PAGES / 2)
                );

                let endPage = Math.min(
                    totalPages,
                    startPage + MAX_VISIBLE_PAGES - 1
                );

                startPage = Math.max(
                    1,
                    endPage - MAX_VISIBLE_PAGES + 1
                );

                const button = (page, label, disabled = false, active = false) => `
                <button
                    type="button"
                    class="btn ${active ? 'btn-primary' : 'btn-outline-primary'} mx-1"
                    data-page="${page}"
                    ${disabled ? 'disabled' : ''}
                    ${active ? 'aria-current="page"' : ''}
                    aria-label="${label}">
                    ${label}
                </button>
            `;

                paginationHTML += `
                <div class="d-flex justify-content-center align-items-center flex-wrap gap-1 mt-4 mb-4">
                    ${button(1, '&laquo;', currentBookPage === 1)}
                    ${button(
                    currentBookPage - 1,
                    '&lsaquo;',
                    currentBookPage === 1
                )}
            `;

                for (let page = startPage; page <= endPage; page++) {
                    paginationHTML += button(
                        page,
                        page,
                        false,
                        page === currentBookPage
                    );
                }

                paginationHTML += `
                    ${button(
                    currentBookPage + 1,
                    '&rsaquo;',
                    currentBookPage === totalPages
                )}
                    ${button(
                    totalPages,
                    '&raquo;',
                    currentBookPage === totalPages
                )}
                </div>
            `;
            }

            pagination.innerHTML = paginationHTML;

            // Gắn sự kiện cho các nút phân trang
            pagination.querySelectorAll('button[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = Number(btn.dataset.page);

                    if (
                        page < 1 ||
                        page > totalPages ||
                        page === currentBookPage
                    ) {
                        return;
                    }

                    currentBookPage = page;
                    renderBookGrids();

                    // Cuộn về đầu danh sách sách
                    gridEl.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                });
            });
        }

        // 6. Cập nhật thông báo
        const status = $('#api-book-status');

        if (status) {
            if (totalBooks === 0) {
                status.textContent = 'Không tìm thấy sách phù hợp.';
            } else {
                const from = startIndex + 1;
                const to = Math.min(startIndex + BOOKS_PER_PAGE, totalBooks);

                status.textContent =
                    `Hiển thị ${from}–${to} trong tổng số ${totalBooks} cuốn sách.`;
            }
        }
    }


    function renderGuestCart() {
        renderCart();
    }

    function escapeCartText(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    document.addEventListener('click', async function (e) {
        const changeButton = e.target.closest('[data-cart-change]') || e.target.closest('[data-qty]');
        const removeButton = e.target.closest('[data-cart-remove]') || e.target.closest('[data-remove-cart]');

        if (!changeButton && !removeButton) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        // XÓA SÁCH KHỎI GIỎ HÀNG
        if (removeButton) {
            const id = Number(removeButton.dataset.cartRemove || removeButton.dataset.removeCart);
            await removeCart(id);
            return;
        }

        // TĂNG / GIẢM SỐ LƯỢNG
        if (changeButton) {
            const id = Number(changeButton.dataset.cartChange || changeButton.dataset.qty);
            const delta = Number(changeButton.dataset.delta);
            await changeQty(id, delta);
            return;
        }
    });




    async function handleAddBookToCart(book) {
        const user = getUser();

        // Chưa đăng nhập: lưu giỏ hàng vào sessionStorage
        if (!user) {
            addGuestBook(book);
            notice('Đã thêm sách vào giỏ hàng.');
            return;
        }

        try {
            const customerId = Number(
                user.maKhachHang ??
                user.MaKhachHang ??
                user.id ??
                user.Id
            );

            if (!Number.isInteger(customerId) || customerId <= 0) {
                console.error('Thông tin người dùng:', user);
                notice('Không tìm thấy mã khách hàng. Vui lòng đăng nhập lại.');
                return;
            }

            const bookId = Number(
                book.maSach ??
                book.MaSach ??
                book.id ??
                book.Id
            );

            if (!Number.isInteger(bookId) || bookId <= 0) {
                console.error('Thông tin sách:', book);
                notice('Không xác định được mã sách.');
                return;
            }

            await request(
                `/cart/customer/add?maKhachHang=${customerId}`,
                {
                    method: 'POST',
                    body: {
                        MaSach: bookId
                    }
                }
            );

            await loadCart();
            updateCartBadge();

            notice('Đã thêm sách vào giỏ hàng.');

            // Cập nhật giỏ hàng nếu hàm tải giỏ đã được định nghĩa
            if (typeof loadCart === 'function') {
                await loadCart();
            }

            // Cập nhật số lượng hiển thị trên biểu tượng giỏ hàng
            updateCartBadge();

        } catch (error) {
            console.error('Lỗi thêm sách vào giỏ:', error);
            notice(error.message || 'Không thể thêm sách vào giỏ hàng.');
        }
    }


    async function syncGuestCartToDatabase() {
        const user = getUser();

        if (!user) return;

        const customerId = Number(
            user.maKhachHang ??
            user.MaKhachHang ??
            user.id ??
            user.Id
        );

        if (!customerId) {
            throw new Error('Không tìm thấy mã khách hàng.');
        }

        const guestCart = getGuestCart();

        if (guestCart.length === 0) return;

        for (const item of guestCart) {
            const bookId = Number(item.MaSach);
            const quantity = Math.max(1, Number(item.SoLuong || 1));

            // API hiện tại thêm một đơn vị sách mỗi lần gọi.
            // Gọi nhiều lần để chuyển đủ số lượng từ giỏ khách.
            for (let i = 0; i < quantity; i++) {
                await request(
                    `/cart/customer/add?maKhachHang=${customerId}`,
                    {
                        method: 'POST',
                        body: JSON.stringify({ MaSach: bookId })
                    }
                );
            }
        }

        // Chỉ xóa giỏ tạm khi đồng bộ thành công toàn bộ
        sessionStorage.removeItem(GUEST_CART_KEY);

        updateGuestCartCount();

        // Tải giỏ hàng chính thức từ database
        if (typeof loadCart === 'function') {
            await loadCart();
        }

        notice('Đã đồng bộ giỏ hàng thành công.');
    }


    const GUEST_CART_KEY = 'apiq-guest-cart';

    // Lấy giỏ hàng khách vãng lai từ sessionStorage
    function getGuestCart() {
        try {
            return JSON.parse(
                sessionStorage.getItem(GUEST_CART_KEY) || '[]'
            );
        } catch {
            return [];
        }
    }

    // Lưu giỏ hàng khách vãng lai
    function saveGuestCart(cart) {
        sessionStorage.setItem(
            GUEST_CART_KEY,
            JSON.stringify(cart)
        );
    }

    // Thêm sách vào giỏ hàng khách vãng lai




    async function addGuestBook(book) {
        const id = Number(
            book.maSach ?? book.MaSach ?? book.id ?? book.Id
        );

        if (!id) {
            notice('Không xác định được mã sách.');
            return;
        }

        const cart = getGuestCart();
        const existing = cart.find(
            item => Number(item.MaSach) === id
        );

        if (existing) {
            existing.SoLuong = Number(existing.SoLuong || 1) + 1;
            existing.HinhAnh = bookImage(book);
        } else {
            cart.push({
                MaSach: id,
                SoLuong: 1,
                TenSach: book.tenSach ?? book.TenSach ?? '',
                Gia: Number(book.gia ?? book.Gia ?? 0),
                HinhAnh: bookImage(book)
            });
        }

        saveGuestCart(cart);

        if (typeof renderGuestCart === 'function') {
            renderGuestCart();
        }

        notice('Đã thêm sách vào giỏ hàng.');
    }


    // Cập nhật số lượng sách trên biểu tượng giỏ hàng
    function updateGuestCartCount() {
        const user = getUser();

        // Nếu chưa đăng nhập thì lấy số lượng từ sessionStorage
        if (!user) {
            const count = getGuestCart().reduce(
                (sum, item) => sum + Number(item.SoLuong || 1),
                0
            );

            document.querySelectorAll('.api-cart-count').forEach(el => {
                el.textContent = count;
            });
        }
    }


    // Gắn sự kiện tìm kiếm một lần

    function bindBookSearch() {
        const search = $('#api-book-search');

        if (!search || search.dataset.bound === '1') return;

        search.dataset.bound = '1';

        // Tìm ngay khi người dùng nhập
        search.addEventListener('input', renderBookGrids);

        // Bấm kính lúp để tìm
        const icon = $('#search-icon-1');

        if (icon && !icon.dataset.bound) {
            icon.dataset.bound = '1';

            icon.addEventListener('click', renderBookGrids);
        }

        const sort = $('#book-sort');

        if (sort && !sort.dataset.bound) {
            sort.dataset.bound = '1';
            sort.addEventListener('change', renderBookGrids);
        }

        // Nhấn Enter để tìm
        search.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                renderBookGrids();
            }
        });
    }



    function bindBookViewMode() {
        const gridButton = document.querySelector('#book-grid-view');
        const listButton = document.querySelector('#book-list-view');
        const bookGrid = document.querySelector('#api-books-grid');

        if (!gridButton || !listButton || !bookGrid) return;

        gridButton.addEventListener('click', function (event) {
            event.preventDefault();

            bookGrid.classList.remove('book-list-view');
            gridButton.classList.add('active');
            listButton.classList.remove('active');
        });

        listButton.addEventListener('click', function (event) {
            event.preventDefault();

            bookGrid.classList.add('book-list-view');
            listButton.classList.add('active');
            gridButton.classList.remove('active');
        });
    }



    async function loadCart() {
        const user = getUser();

        console.log('[Giỏ hàng] Người dùng:', user);

        try {
            if (user && idOf(user)) {
                // Đã đăng nhập: lấy giỏ hàng từ database
                const customerId = idOf(user);

                const data = await request(
                    `/cart/customer/${customerId}`
                );

                console.log('[Giỏ hàng] API trả về:', data);

                const result = unwrap(data);

                // Hỗ trợ API trả về mảng trực tiếp hoặc bọc trong data/result/items
                const items = Array.isArray(result)
                    ? result
                    : result?.items ?? result?.Items;

                state.cart = Array.isArray(items) ? items : [];
            } else {
                // Chưa đăng nhập: lấy giỏ hàng từ sessionStorage
                state.cart = getGuestCart();
            }
        } catch (error) {
            console.error('[Giỏ hàng] Lỗi tải:', error);

            state.cart = [];

            notice(
                error.message || 'Không tải được giỏ hàng.',
                'error'
            );
        }

        renderCart();
        updateCartBadge();

        console.log('[Giỏ hàng] Dữ liệu cuối cùng:', state.cart);

        return state.cart;
    }

    function cId(x) { return x?.maSach ?? x?.MaSach; } function cQty(x) { return x?.soLuong ?? x?.SoLuong ?? 1; } function cName(x) { return x?.tenSach ?? x?.TenSach ?? 'Sách'; } function cPrice(x) { return x?.gia ?? x?.Gia ?? x?.donGia ?? x?.DonGia ?? 0; } function cImg(x) { return x?.hinh ?? x?.Hinh ?? x?.anhBia ?? x?.AnhBia ?? ''; }
    function cartTotal() { return state.cart.reduce((s, x) => s + Number(cPrice(x)) * Number(cQty(x)), 0); }
    function updateCartBadge() { const count = state.cart.reduce((s, x) => s + Number(cQty(x)), 0); $$('.api-cart-count').forEach(e => e.textContent = count); const old = $('.nav-bar .fa-shopping-cart')?.parentElement; if (old && !old.querySelector('.api-cart-count')) old.insertAdjacentHTML('beforeend', ` <span class="api-cart-count badge bg-primary">${count}</span>`); }
    async function addCart(id) { try { const u = getUser(); if (u && idOf(u)) await request('/cart/customer/add?maKhachHang=' + encodeURIComponent(idOf(u)), { method: 'POST', body: { MaSach: Number(id) } }); else await request('/cart/guest/add', { method: 'POST', body: { MaSach: Number(id) } }); await loadCart(); notice('Đã thêm sách vào giỏ hàng'); } catch (e) { notice(e.message, 'error'); } }


    function renderCart() {
        const body = $('#api-cart-body');
        if (!body) return;

        const cart = Array.isArray(state.cart) ? state.cart : [];

        if (cart.length === 0) {
            body.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    Giỏ hàng trống.
                    <a href="shop.html">Tiếp tục mua sách</a>
                </td>
            </tr>`;
            updateCartTotals(0, 0);
            return;
        }

        let totalQuantity = 0;
        let totalPrice = 0;

        body.innerHTML = cart.map(x => {
            const book = x.sach ?? x.Sach ?? x;

            const bookId =
                x.maSach ?? x.MaSach ??
                book.maSach ?? book.MaSach;

            const name = book.tenSach ?? book.TenSach ?? x.tenSach ?? x.TenSach ?? 'Sách';

            const price = Number(
                x.gia ?? x.Gia ??
                x.donGia ?? x.DonGia ??
                book.gia ?? book.Gia ?? 0
            );

            const qty = Number(x.soLuong ?? x.SoLuong ?? 1);

            const image =
                book.anhBia ?? book.AnhBia ??
                book.hinhAnh ?? book.HinhAnh ??
                x.anhBia ?? x.AnhBia ??
                x.hinh ?? x.Hinh ?? '';

            const lineTotal = price * qty;

            totalQuantity += qty;
            totalPrice += lineTotal;

            const imgSrc = bookImage({ anhBia: image });

            return `
            <tr data-cart-row="${bookId}">
                <td>
                    <div class="d-flex align-items-center">
                        <img
                            src="${esc(imgSrc)}"
                            alt="${esc(name)}"
                            style="width:70px;height:90px;object-fit:contain;border-radius:6px;background:#f8f9fa;border:1px solid #eee;"
                            onerror="this.onerror=null;this.src='image/ThuVien.jpg';">

                        <span class="ms-3 fw-bold">${esc(name)}</span>
                    </div>
                </td>

                <td class="align-middle">${money(price)}</td>

                <td class="align-middle">
                    <div class="input-group cart-qty-group" style="width:165px; min-width:150px;">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary cart-qty-btn"
                            data-cart-change="${bookId}"
                            data-qty="${bookId}"
                            data-delta="-1"
                            title="Giảm 1"
                            style="width:42px; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center;">−</button>

                        <input
                            class="form-control text-center bg-white cart-qty-input"
                            value="${qty}"
                            readonly
                            style="font-weight:700; font-size:16px; min-width:65px; padding:4px 6px;">

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary cart-qty-btn"
                            data-cart-change="${bookId}"
                            data-qty="${bookId}"
                            data-delta="1"
                            title="Tăng 1"
                            style="width:42px; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center;">+</button>
                    </div>
                </td>

                <td class="align-middle fw-bold text-primary">${money(lineTotal)}</td>

                <td class="align-middle">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        data-cart-remove="${bookId}"
                        data-remove-cart="${bookId}"
                        title="Xóa khỏi giỏ hàng">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        updateCartTotals(totalPrice, totalQuantity);
    }



    const COUPON_KEY = 'apiq-applied-coupon';

    function getAppliedCoupon() {
        try {
            const raw = sessionStorage.getItem(COUPON_KEY) || localStorage.getItem(COUPON_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setAppliedCoupon(c) {
        if (c) {
            sessionStorage.setItem(COUPON_KEY, JSON.stringify(c));
            localStorage.setItem(COUPON_KEY, JSON.stringify(c));
        } else {
            sessionStorage.removeItem(COUPON_KEY);
            localStorage.removeItem(COUPON_KEY);
        }
    }

    function updateCartTotals(totalPrice, totalQuantity) {
        // Tạm tính ban đầu (chưa giảm giá)
        const subtotal = $('#api-cart-subtotal');
        if (subtotal) {
            subtotal.textContent = money(totalPrice);
        }

        // Xử lý mã giảm giá trên giao diện người dùng
        const coupon = getAppliedCoupon();
        let discountAmount = 0;
        let finalPrice = totalPrice;

        const discountRow = $('#api-cart-discount-row');
        const discountBadge = $('#api-cart-discount-badge');
        const discountText = $('#api-cart-discount');
        const removeCouponBtn = $('#api-remove-coupon-btn');
        const couponInput = $('#api-coupon-code');

        if (coupon && totalPrice > 0) {
            discountAmount = Math.round(totalPrice * (Number(coupon.percent || 0) / 100));
            finalPrice = Math.max(0, totalPrice - discountAmount);

            if (discountRow) {
                discountRow.style.setProperty('display', 'flex', 'important');
            }
            if (discountBadge) {
                discountBadge.textContent = `${coupon.code} (-${coupon.percent}%)`;
            }
            if (discountText) {
                discountText.textContent = `-${money(discountAmount)}`;
            }
            if (removeCouponBtn) {
                removeCouponBtn.style.display = 'inline-block';
            }
            if (couponInput && !couponInput.value) {
                couponInput.value = coupon.code;
            }
        } else {
            if (discountRow) {
                discountRow.style.setProperty('display', 'none', 'important');
            }
            if (removeCouponBtn) {
                removeCouponBtn.style.display = 'none';
            }
        }

        // Tổng tiền (thành tiền đã giảm theo trên giao diện người dùng)
        const total = $('#api-cart-total');
        if (total) {
            total.textContent = money(finalPrice);
        }

        // Tổng số lượng sách trong giỏ hàng
        const quantityElement = $('#api-cart-quantity');
        if (quantityElement) {
            quantityElement.textContent = totalQuantity;
        }

        // Tổng tiền ở phần checkout nếu có
        const checkoutTotal = $('#api-checkout-total');
        if (checkoutTotal) {
            checkoutTotal.textContent = money(finalPrice);
        }
    }

    function initCartCoupon() {
        const applyBtn = $('#api-apply-coupon-btn');
        const removeBtn = $('#api-remove-coupon-btn');
        const couponInput = $('#api-coupon-code');
        const couponMsg = $('#api-coupon-message');

        if (!applyBtn && !couponInput) return;

        function showCouponMsg(text, isError = false) {
            if (!couponMsg) return;
            couponMsg.style.display = 'block';
            couponMsg.className = `mt-2 small fw-semibold ${isError ? 'text-danger' : 'text-success'}`;
            couponMsg.innerHTML = isError
                ? `<i class="fas fa-exclamation-circle me-1"></i> ${esc(text)}`
                : `<i class="fas fa-check-circle me-1"></i> ${esc(text)}`;
        }

        function clearCouponMsg() {
            if (couponMsg) {
                couponMsg.style.display = 'none';
                couponMsg.textContent = '';
            }
        }

        // Phân tích mã giảm giá
        function parseCoupon(codeRaw) {
            const code = String(codeRaw || '').trim().toUpperCase();
            if (!code) return null;

            // Mã hết hạn
            if (code === 'EXPIRED5') {
                return { valid: false, error: 'Mã giảm giá EXPIRED5 đã hết hạn sử dụng!' };
            }

            // Các mã mẫu từ cơ sở dữ liệu
            if (code === 'FLASH50') return { valid: true, code, percent: 50 };
            if (code === 'SUMMER20') return { valid: true, code, percent: 20 };
            if (code === 'VIP15') return { valid: true, code, percent: 15 };
            if (code === 'WELCOME10') return { valid: true, code, percent: 10 };

            // Tìm số phần trăm trong mã (VD: GIAM20, SALE30, KM15...)
            const match = code.match(/(\d{1,2})/);
            if (match) {
                const percent = Math.min(90, Math.max(5, parseInt(match[1], 10)));
                return { valid: true, code, percent };
            }

            // Mã hợp lệ thông thường: mặc định giảm 10%
            return { valid: true, code, percent: 10 };
        }

        async function handleApply() {
            clearCouponMsg();
            const code = couponInput ? couponInput.value.trim() : '';

            if (!code) {
                showCouponMsg('Vui lòng nhập mã giảm giá.', true);
                if (couponInput) couponInput.focus();
                return;
            }

            const cart = Array.isArray(state.cart) ? state.cart : [];
            if (cart.length === 0) {
                showCouponMsg('Giỏ hàng đang trống! Vui lòng thêm sách vào giỏ hàng.', true);
                return;
            }

            const parsed = parseCoupon(code);
            if (!parsed || !parsed.valid) {
                showCouponMsg(parsed?.error || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.', true);
                return;
            }

            setAppliedCoupon({
                code: parsed.code,
                percent: parsed.percent
            });

            // Tính lại tổng tiền ngay lập tức
            renderCart();

            showCouponMsg(`Áp dụng thành công mã "${parsed.code}": Giảm ${parsed.percent}% trên tổng đơn hàng!`, false);
            notice(`Đã áp dụng mã giảm giá ${parsed.code} (-${parsed.percent}%)`);
        }

        function handleRemove() {
            setAppliedCoupon(null);
            if (couponInput) couponInput.value = '';
            clearCouponMsg();
            renderCart();
            notice('Đã hủy áp dụng mã giảm giá');
        }

        if (applyBtn) {
            applyBtn.onclick = handleApply;
        }

        if (removeBtn) {
            removeBtn.onclick = handleRemove;
        }

        if (couponInput) {
            couponInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                }
            });

            // Khôi phục mã đã lưu
            const saved = getAppliedCoupon();
            if (saved && saved.code) {
                couponInput.value = saved.code;
            }
        }
    }


    async function changeQty(id, delta) {
        const numId = Number(id);
        const user = getUser();
        const customerId = user?.maKhachHang ?? user?.MaKhachHang;

        // Tìm sách trong state.cart
        const item = (Array.isArray(state.cart) ? state.cart : []).find(x => {
            const book = x.sach ?? x.Sach ?? x;
            const bId = Number(x.maSach ?? x.MaSach ?? book.maSach ?? book.MaSach);
            return bId === numId;
        });

        if (!item) {
            console.warn('Không tìm thấy sách trong giỏ hàng:', numId);
            return;
        }

        const currentQty = Number(item.soLuong ?? item.SoLuong ?? 1);
        const newQty = currentQty + delta;

        if (newQty <= 0) {
            const confirmDelete = confirm('Bạn có muốn xóa sách này khỏi giỏ hàng không?');
            if (confirmDelete) {
                await removeCart(numId);
            }
            return;
        }

        // 1. Cập nhật số lượng ngay lập tức vào state
        item.soLuong = newQty;
        item.SoLuong = newQty;

        // 2. Tính lại thành tiền của từng sách và tổng tiền giỏ hàng ngay lập tức
        renderCart();
        updateCartBadge();

        // 3. Đồng bộ với Backend hoặc SessionStorage
        try {
            if (customerId != null) {
                let url =
                    '/cart/capnhatsoluong?maSach=' +
                    encodeURIComponent(numId) +
                    '&quantity=' +
                    encodeURIComponent(delta) +
                    '&maKhachHang=' +
                    encodeURIComponent(customerId);

                console.log('Gọi API cập nhật số lượng:', url);

                await request(url, {
                    method: 'PUT'
                });
            } else {
                // Khách chưa đăng nhập: lưu vào sessionStorage
                let guestCart = getGuestCart();
                const gItem = guestCart.find(
                    x => Number(x.MaSach ?? x.maSach) === numId
                );
                if (gItem) {
                    gItem.SoLuong = newQty;
                    if (gItem.soLuong !== undefined) gItem.soLuong = newQty;
                }
                saveGuestCart(guestCart);
            }
        } catch (e) {
            console.error('Lỗi cập nhật số lượng:', e);
            notice(e.message || 'Không cập nhật được số lượng.', 'error');
            await loadCart();
            updateCartBadge();
        }
    }



    async function removeCart(id) {
        const numId = Number(id);
        const user = getUser();
        const customerId = user?.maKhachHang ?? user?.MaKhachHang;

        // Xóa ngay lập tức khỏi state để giao diện cập nhật tức thì
        state.cart = (Array.isArray(state.cart) ? state.cart : []).filter(x => {
            const book = x.sach ?? x.Sach ?? x;
            const bId = Number(x.maSach ?? x.MaSach ?? book.maSach ?? book.MaSach);
            return bId !== numId;
        });

        renderCart();
        updateCartBadge();

        try {
            if (customerId != null) {
                let url = '/cart/delete/' + encodeURIComponent(numId) + '?maKhachHang=' + encodeURIComponent(customerId);
                await request(url, { method: 'DELETE' });
            } else {
                let guestCart = getGuestCart();
                guestCart = guestCart.filter(
                    item => Number(item.MaSach ?? item.maSach) !== numId
                );
                saveGuestCart(guestCart);
            }

            notice('Đã xóa sách khỏi giỏ hàng!');
        } catch (e) {
            console.error('Lỗi xóa sách:', e);
            notice(e.message || 'Không thể xóa sách khỏi giỏ hàng.', 'error');
            await loadCart();
            updateCartBadge();
        }
    }



    function formPage(title, body) { let main = $('#api-page-content'); if (!main) { main = document.createElement('div'); main.id = 'api-page-content'; main.className = 'container py-5'; const target = $('main') || $('.container-fluid.py-5') || $('body'); target.prepend(main); } main.innerHTML = `<div class="row justify-content-center"><div class="col-lg-8"><div class="bg-light rounded p-4 p-md-5"><h2 class="mb-4 text-center">${title}</h2>${body}</div></div></div>`; return main; }
    function bindForm(id, fn) { const f = $('#' + id); if (f) f.addEventListener('submit', async e => { e.preventDefault(); const btn = f.querySelector('[type=submit]'); if (btn) btn.disabled = true; try { await fn(new FormData(f), f); } catch (err) { notice(err.message, 'error'); } finally { if (btn) btn.disabled = false; } }); }

    function initLogin() {
        formPage('Đăng nhập', `
        <form id="api-login-form">
            <div class="mb-3">
                <label class="form-label">Tên đăng nhập</label>
                <input class="form-control"
                       name="UserName"
                       required minlength="3" maxlength="20"
                       autocomplete="username">
            </div>

            <div class="mb-3">
                <label class="form-label">Mật khẩu</label>
                <input class="form-control"
                       name="Password"
                       type="password"
                       required
                       autocomplete="current-password">
            </div>

            <button class="btn btn-primary rounded-pill w-100"
                    type="submit">
                Đăng nhập
            </button>

            <p class="mt-3 mb-0 text-center">
                Chưa có tài khoản?
                <a href="register.html">Đăng ký</a>
            </p>
        </form>
    `);


        bindForm('api-login-form', async fd => {
            const d = await request('/KhachHang/login', {
                method: 'POST',
                body: {
                    UserName: fd.get('UserName'),
                    Password: fd.get('Password')
                }
            });

            const u = unwrap(d);

            if (!u) {
                throw new Error('API không trả về thông tin người dùng.');
            }

            // Lưu thông tin đăng nhập
            setUser(u);

            // Không yêu cầu xác thực OTP khi đăng nhập
            sessionStorage.removeItem('apiq-pending-user');

            // Đồng bộ giỏ hàng khách vãng lai vào database
            const customerId = idOf(u);

            if (customerId) {
                try {
                    await request('/cart/guest/to-db/' + customerId, {
                        method: 'POST'
                    });

                    sessionStorage.removeItem('apiq-guest-cart');
                } catch (e) {
                    console.error('Lỗi đồng bộ giỏ hàng:', e);
                    notice('Đăng nhập thành công nhưng chưa đồng bộ được giỏ hàng.');
                }
            }

            // Chuyển thẳng vào trang chủ
            location.href = 'index.html';
        });

    }

    function initRegister() { formPage('Tạo tài khoản', `<form id="api-register-form"><div class="mb-3"><label class="form-label">Tên đăng nhập</label><input class="form-control" name="TenDangNhap" required minlength="3" maxlength="20"></div><div class="mb-3"><label class="form-label">Họ và tên</label><input class="form-control" name="TenKhachHang" required></div><div class="mb-3"><label class="form-label">Email</label><input class="form-control" name="Email" type="email" required></div><div class="mb-3"><label class="form-label">Số điện thoại</label><input class="form-control" name="SoDienThoai" required pattern="0[3578][0-9]{8}"></div><div class="mb-3"><label class="form-label">Mật khẩu (ít nhất 6 ký tự)</label><input class="form-control" name="MatKhau" type="password" minlength="6" required></div><div class="mb-3"><label class="form-label">Nhập lại mật khẩu</label><input class="form-control" name="KiemTraMatKhau" type="password" minlength="6" required></div><button class="btn btn-primary rounded-pill w-100" type="submit">Đăng ký và gửi OTP</button><p class="mt-3 text-center">Đã có tài khoản? <a href="login.html">Đăng nhập</a></p></form>`); bindForm('api-register-form', async fd => { if (fd.get('MatKhau') !== fd.get('KiemTraMatKhau')) throw Error('Mật khẩu nhập lại không khớp'); const d = await request('/KhachHang/signin', { method: 'POST', body: Object.fromEntries(fd.entries()) }); const u = unwrap(d); sessionStorage.setItem('apiq-pending-user', JSON.stringify(u)); notice('Đăng ký thành công. Hãy nhập OTP được gửi qua email.'); location.href = 'verify-otp.html'; }); }
    function initOtp() { const pending = (() => { try { return JSON.parse(sessionStorage.getItem('apiq-pending-user') || 'null') } catch { return null } })(); const id = idOf(pending); formPage('Xác thực OTP email', `<p class="text-center">Nhập mã OTP đã gửi đến email đăng ký.</p><form id="api-otp-form"><div class="mb-3"><label class="form-label">Mã OTP</label><input class="form-control text-center" name="OTP" required maxlength="10" autocomplete="one-time-code"></div><button class="btn btn-primary rounded-pill w-100" type="submit">Xác thực email</button></form><button id="api-resend-otp" class="btn btn-outline-primary rounded-pill w-100 mt-3">Gửi lại OTP</button><p class="small text-muted mt-3">Nếu bạn vừa đăng ký, mã khách hàng được lưu trong phiên đăng ký. Nếu tải lại trang mà mất mã, vui lòng đăng ký/đăng nhập lại để lấy thông tin.</p>`); bindForm('api-otp-form', async fd => { if (!id) throw Error('Không tìm thấy mã khách hàng đang chờ xác thực. Hãy đăng ký lại hoặc đăng nhập.'); await request('/KhachHang/verify-otp/' + id, { method: 'POST', body: { OTP: fd.get('OTP') } }); if (pending) { pending.isVerified = true; setUser(pending); } sessionStorage.removeItem('apiq-pending-user'); notice('Xác thực email thành công'); location.href = 'login.html'; }); $('#api-resend-otp')?.addEventListener('click', async () => { if (!id) { notice('Không tìm thấy mã khách hàng. Hãy đăng ký lại.', 'error'); return; } try { await request('/KhachHang/resend-otp/' + id, { method: 'POST' }); notice('Đã gửi lại OTP'); } catch (e) { notice(e.message, 'error'); } }); }

    async function initProfile() {
        formPage('Thông tin cá nhân', '<p>Đang tải thông tin...</p>');

        const content = $('#api-page-content .bg-light');

        try {
            // Lấy thông tin của khách hàng đang đăng nhập từ API
            const data = await request('/KhachHang/my-info');
            const u = unwrap(data) || {};

            const getValue = (lower, upper) =>
                u[lower] ?? u[upper] ?? '';

            content.innerHTML = `
            <h2 class="mb-4 text-center">Thông tin cá nhân</h2>

            <form id="api-profile-form">
                <div class="mb-3">
                    <label class="form-label">Mã khách hàng</label>
                    <input class="form-control"
                        value="${esc(getValue('maKhachHang', 'MaKhachHang'))}"
                        readonly>
                </div>

                <div class="mb-3">
                    <label class="form-label">Tên đăng nhập</label>
                    <input class="form-control"
                        value="${esc(getValue('tenDangNhap', 'TenDangNhap'))}"
                        readonly>
                </div>

                <div class="mb-3">
                    <label class="form-label">Họ và tên</label>
                    <input class="form-control"
                        name="TenKhachHang"
                        value="${esc(getValue('tenKhachHang', 'TenKhachHang'))}"
                        required maxlength="100">
                </div>

                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input class="form-control"
                        type="email"
                        name="Email"
                        value="${esc(getValue('email', 'Email'))}"
                        readonly>
                </div>

                <div class="mb-3">
                    <label class="form-label">Số điện thoại</label>
                    <input class="form-control"
                        type="tel"
                        name="SoDienThoai"
                        value="${esc(getValue('soDienThoai', 'SoDienThoai'))}"
                        required>
                </div>

                <div class="mb-3">
                    <label class="form-label">Địa chỉ</label>
                    <input class="form-control"
                        name="DiaChi"
                        value="${esc(getValue('diaChi', 'DiaChi'))}">
                </div>

                <button class="btn btn-primary rounded-pill"
                    type="submit" id="api-profile-save">
                    Lưu thay đổi
                </button>
            </form>
        `;

            bindForm('api-profile-form', async fd => {
                const button = $('#api-profile-save');

                try {
                    const body = {
                        TenKhachHang: String(
                            fd.get('TenKhachHang') || ''
                        ).trim(),

                        SoDienThoai: String(
                            fd.get('SoDienThoai') || ''
                        ).trim(),

                        Email: String(
                            fd.get('Email') || ''
                        ).trim(),

                        DiaChi: String(
                            fd.get('DiaChi') || ''
                        ).trim()
                    };

                    if (!body.TenKhachHang) {
                        notice('Vui lòng nhập họ và tên.');
                        return;
                    }

                    if (!body.SoDienThoai) {
                        notice('Vui lòng nhập số điện thoại.');
                        return;
                    }

                    button.disabled = true;
                    button.textContent = 'Đang lưu...';

                    console.log('Dữ liệu cập nhật:', body);

                    await request('/KhachHang/my-info', {
                        method: 'PUT',
                        body
                    });

                    notice('Cập nhật thông tin thành công!');

                    // Tải lại từ API để xác nhận dữ liệu mới
                    await initProfile();

                } catch (error) {
                    console.error('Lỗi cập nhật hồ sơ:', error);

                    notice(
                        error.message ||
                        'Không thể cập nhật thông tin cá nhân.'
                    );

                    button.disabled = false;
                    button.textContent = 'Lưu thay đổi';
                }
            });

        } catch (error) {
            console.error('Lỗi tải hồ sơ:', error);

            content.innerHTML = `
            <div class="text-center">
                <h3>Không tải được thông tin cá nhân</h3>
                <p>${esc(
                error.message ||
                'Vui lòng đăng nhập lại.'
            )}</p>
                <a href="login.html"
                    class="btn btn-primary rounded-pill">
                    Đăng nhập
                </a>
            </div>
        `;
        }
    }


    async function getVietQR(amount, maHoaDon) {
        const params = new URLSearchParams({
            amount: String(Math.round(Number(amount))),
            maHoaDon: String(maHoaDon)
        });

        const response = await request(
            `/vietqr/test?${params.toString()}`
        );

        const data = unwrap(response) || {};

        const qrUrl =
            data.qrCode ??
            data.QRCode ??
            data.qrUrl ??
            data.QRUrl;

        if (!qrUrl) {
            throw new Error('API VietQR không trả về đường dẫn mã QR.');
        }

        return qrUrl;
    }


    async function initFavorites() {
        formPage('Sách yêu thích', '<p>Đang tải danh sách...</p>');

        try {
            // Kiểm tra khách hàng đã đăng nhập
            const user = getUser();

            if (!user || !idOf(user)) {
                $('#api-page-content .bg-light').innerHTML = `
                <h2 class="mb-4 text-center">Sách yêu thích</h2>
                <div class="text-center py-4">
                    <p>Vui lòng đăng nhập để xem sách yêu thích.</p>
                    <a href="login.html" class="btn btn-primary rounded-pill">
                        Đăng nhập
                    </a>
                </div>`;
                return;
            }

            // Lấy danh sách yêu thích từ API
            const d = await request('/sach-yeu-thich');
            const result = unwrap(d);
            const list = Array.isArray(result) ? result : [];

            $('#api-page-content .bg-light').innerHTML = `
            <h2 class="mb-4 text-center">Sách yêu thích</h2>
            <div id="api-favorites-message"></div>
            <div class="row" id="api-favorites-list">
                ${list.map(x => {
                const b = x.sach ?? x.Sach ?? x;
                const id = bookId(b) ?? x.maSach ?? x.MaSach;
                const anhBia = b.anhBia ?? b.AnhBia ?? '';

                const imagePath = anhBia
                    ? (anhBia.startsWith('image/')
                        ? anhBia
                        : 'image/sach/' + anhBia.replace(/^\/+/, ''))
                    : 'image/ThuVien.jpg';

                if (id == null) return '';

                return `
                            <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
                                <div class="card h-100 p-3">
                                    <img
                                        src="${esc(
                    bookImage(b)
                        ? (bookImage(b).startsWith('image/')
                            ? bookImage(b)
                            : 'image/sach/' + bookImage(b).replace(/^\/+/, ''))
                        : 'image/ThuVien.jpg'
                )}"
                                        alt="${esc(bookTitle(b))}"
                                        class="img-fluid"
                                        style="height:180px; width:100%; object-fit:contain"
                                        onerror="this.onerror=null;this.src='image/ThuVien.jpg'">

                                    <h6 class="mt-3">
                                        ${esc(bookTitle(b))}
                                    </h6>

                                    <div class="text-primary fw-bold">
                                        ${money(bookPrice(b))}
                                    </div>

                                    <a class="btn btn-outline-primary mt-2"
                                       href="book.html?id=${encodeURIComponent(id)}">
                                        Chi tiết
                                    </a>

                                    <button
                                        type="button"
                                        class="btn btn-outline-danger mt-2"
                                        data-remove-favorite="${esc(String(id))}">
                                        <i class="fas fa-heart-broken me-1"></i>
                                        Bỏ yêu thích
                                    </button>
                                </div>
                            </div>`;
            }).join('')
                || `<div class="col-12 text-center py-4">
                            <i class="fas fa-heart fa-3x text-muted mb-3"></i>
                            <p>Bạn chưa có sách yêu thích.</p>
                            <a href="shop.html" class="btn btn-primary rounded-pill">
                                Khám phá sách
                            </a>
                        </div>`
                }
            </div>`;

            // Xử lý nút bỏ yêu thích
            document.querySelectorAll('[data-remove-favorite]')
                .forEach(button => {
                    button.addEventListener('click', async () => {
                        const maSach = button.dataset.removeFavorite;

                        if (!confirm('Bạn có muốn bỏ sách này khỏi danh sách yêu thích?')) {
                            return;
                        }

                        button.disabled = true;

                        try {
                            await request(
                                '/sach-yeu-thich/' + encodeURIComponent(maSach),
                                { method: 'DELETE' }
                            );

                            notice('Đã bỏ sách khỏi danh sách yêu thích!');

                            // Tải lại danh sách sau khi xóa
                            await initFavorites();
                        } catch (error) {
                            button.disabled = false;
                            notice(error.message || 'Không thể bỏ yêu thích.');
                        }
                    });
                });

        } catch (error) {
            console.error('Lỗi tải sách yêu thích:', error);

            $('#api-page-content .bg-light').innerHTML = `
            <h2 class="mb-4 text-center">Sách yêu thích</h2>
            <div class="alert alert-danger">
                Không thể tải danh sách sách yêu thích:
                ${esc(error.message || 'Lỗi kết nối API')}
            </div>
            <div class="text-center">
                <button id="api-retry-favorites"
                        class="btn btn-primary rounded-pill">
                    Thử lại
                </button>
            </div>`;

            document.getElementById('api-retry-favorites')
                ?.addEventListener('click', initFavorites);
        }
    }


    async function initOrders() {
        formPage('Lịch sử mua hàng', '<p>Đang tải lịch sử mua hàng...</p>');

        const container = $('#api-page-content .bg-light');

        try {
            const response = await request('/HoaDon/lich-su');
            const data = unwrap(response);
            const orders = Array.isArray(data) ? data : [];

            container.innerHTML = `
            <h2 class="mb-4 text-center">Lịch sử mua hàng</h2>

            ${orders.length > 0
                    ? orders.map(order => `
                        <div class="card mb-4 shadow-sm">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Mã hóa đơn: #${esc(String(order.maHoaDon))}</strong>
                                </div>
                                <span class="badge ${order.phuongThucThanhToan === 'ChuyenKhoan'
                            ? 'bg-primary'
                            : 'bg-success'
                        }">
                                    ${esc(
                            order.phuongThucThanhToan === 'ChuyenKhoan'
                                ? 'Chuyển khoản'
                                : order.phuongThucThanhToan
                        )}
                                </span>
                            </div>

                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-6 mb-2">
                                        <strong>Ngày lập:</strong>
                                        ${esc(
                            order.ngayLap
                                ? new Date(order.ngayLap).toLocaleString('vi-VN')
                                : 'Chưa cập nhật'
                        )}
                                    </div>

                                    <div class="col-md-6 mb-2">
                                        <strong>Số điện thoại:</strong>
                                        ${esc(String(order.soDienThoai || 'Chưa cập nhật'))}
                                    </div>

                                    <div class="col-md-6 mb-2">
                                        <strong>Địa chỉ nhận hàng:</strong>
                                        ${esc(String(order.diaChi || 'Chưa cập nhật'))}
                                    </div>

                                    <div class="col-md-6 mb-2">
                                        <strong>Ghi chú:</strong>
                                        ${esc(String(order.ghiChu || 'Không có'))}
                                    </div>
                                </div>

                                <hr>

                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fw-bold">Tổng tiền:</span>
                                    <span class="text-danger fw-bold fs-5">
                                        ${money(order.tongTien ?? 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')
                    : `
                        <div class="text-center py-5">
                            <p class="text-muted">Bạn chưa có đơn hàng nào.</p>
                            <a href="shop.html" class="btn btn-primary">
                                Tiếp tục mua sắm
                            </a>
                        </div>
                    `
                }
        `;
        } catch (error) {
            console.error('Lỗi tải lịch sử mua hàng:', error);

            container.innerHTML = `
            <div class="alert alert-danger">
                Không thể tải lịch sử mua hàng:
                ${esc(error.message || 'Đã xảy ra lỗi')}
            </div>
        `;
        }
    }

    async function showBook() {
        const id = new URLSearchParams(location.search).get('id'); if (!id) return; let b = state.books.find(x => String(bookId(x)) === String(id)); if (!b) b = unwrap(await request('/sach/' + id)); const main = $('#api-page-content') || (() => { const x = document.createElement('div'); x.id = 'api-page-content'; x.className = 'container py-5'; document.body.insertBefore(x, $('footer')); return x; })(); main.innerHTML = `<div class="row g-5"><div class="col-md-5"><img class="img-fluid rounded" style="width:100%;max-height:520px;object-fit:contain" src="${esc(bookImage(b))}" onerror="this.src='image/ThuVien.jpg'"></div><div class="col-md-7"><h2>${esc(bookTitle(b))}</h2><h3 class="text-primary my-3">${money(bookPrice(b))}</h3><p>Tác giả: ${esc(b.tenTacGia ?? b.TenTacGia ?? 'Đang cập nhật')}</p><p>Thể loại: ${esc(b.tenTheLoai ?? b.TenTheLoai ?? '')}</p><button class="btn btn-primary rounded-pill me-2" data-add-cart="${id}">Thêm vào giỏ</button><button class="btn btn-outline-danger rounded-pill" data-favorite="${id}">♡ Yêu thích</button><hr><h4>Đánh giá sách</h4><div id="api-reviews">Đang tải đánh giá...</div><form id="api-review-form" class="mt-3"><label class="form-label">Số sao</label><select name="SoSao" class="form-select mb-2" required><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select><textarea name="NoiDung" class="form-control mb-2" rows="3" placeholder="Nội dung đánh giá"></textarea><button class="btn btn-primary rounded-pill" type="submit">Gửi đánh giá</button></form></div></div>`;
        try { const d = await request('/danh-gia-sach/' + id); const list = Array.isArray(unwrap(d)) ? unwrap(d) : []; $('#api-reviews').innerHTML = list.map(r => `<div class="border rounded p-3 mb-2"><div class="text-warning">${'★'.repeat(Number(r.soSao ?? r.SoSao ?? 0))}</div><p class="mb-1">${esc(r.noiDung ?? r.NoiDung ?? '')}</p><small class="text-muted">${esc(r.ngayDanhGia ?? r.NgayDanhGia ?? '')}</small>${r.maDanhGia || r.MaDanhGia ? ` <button class="btn btn-sm btn-outline-primary" data-edit-review="${r.maDanhGia ?? r.MaDanhGia}" data-review-stars="${r.soSao ?? r.SoSao ?? 5}" data-review-text="${esc(r.noiDung ?? r.NoiDung ?? '')}">Sửa</button> <button class="btn btn-sm btn-outline-danger" data-delete-review="${r.maDanhGia ?? r.MaDanhGia}">Xóa</button>` : ''}</div>`).join('') || '<p>Chưa có đánh giá.</p>'; } catch (e) { $('#api-reviews').textContent = e.message; }
        bindForm('api-review-form', async fd => { const payload = { MaDanhGia: editingReviewId || 0, MaSach: Number(id), SoSao: Number(fd.get('SoSao')), NoiDung: fd.get('NoiDung') }; await request('/danh-gia-sach', { method: editingReviewId ? 'PUT' : 'POST', body: payload }); editingReviewId = null; $('#api-review-form').reset(); notice('Đã lưu đánh giá'); showBook(); });
    }





    async function initCheckout() {
        const $id = id => document.getElementById(id);

        const itemsElement = $id('api-checkout-items');
        const subtotalElement = $id('api-checkout-subtotal');
        const shippingElement = $id('api-checkout-shipping');
        const totalElement = $id('api-checkout-total');
        const placeOrderButton = $id('api-place-order');
        const qrSection = $id('api-qr-section');
        const qrImage = $id('api-qr-image');

        if (!itemsElement || !placeOrderButton) {
            console.error(
                '[Checkout] Không tìm thấy bảng giỏ hàng hoặc nút đặt hàng.'
            );
            return;
        }

        let checkoutItems = [];
        let checkoutTotal = 0;
        let isSubmitting = false;

        // Lấy giá trị từ nhiều kiểu ID/name của HTML.
        const getValue = (...selectors) => {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.value != null) {
                    return String(element.value).trim();
                }
            }
            return '';
        };

        const getPaymentMethod = () => {
            const selected = document.querySelector(
                'input[name="paymentMethod"]:checked'
            );

            if (selected) {
                const value = String(selected.value).toUpperCase();

                if (value.includes('QR') || value.includes('VIETQR')) {
                    return 'VietQR';
                }

                if (value === 'COD') return 'COD';
            }

            if ($id('payment-qr')?.checked) return 'VietQR';
            if ($id('payment-cod')?.checked) return 'COD';

            return '';
        };


        const showMessage = (message, type = 'info') => {
            const result = $id('api-payment-result');

            if (result) {
                const cssClass = type === 'error'
                    ? 'alert-danger'
                    : type === 'success'
                        ? 'alert-success'
                        : 'alert-info';

                result.innerHTML =
                    `<div class="alert ${cssClass}">${esc(message)}</div>`;
            } else {
                notice(message, type);
            }
        };

        // Ẩn QR cũ.
        if (qrSection) qrSection.hidden = true;
        if (qrImage) qrImage.removeAttribute('src');

        // Ẩn QR khi người dùng đổi phương thức.
        document.querySelectorAll(
            'input[name="paymentMethod"], #payment-cod, #payment-qr'
        ).forEach(input => {
            input.addEventListener('change', () => {
                if (qrSection) qrSection.hidden = true;
                if (qrImage) qrImage.removeAttribute('src');
            });
        });

        // ==================================================
        // 1. TẢI GIỎ HÀNG
        // ==================================================
        itemsElement.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-3">
                Đang tải giỏ hàng...
            </td>
        </tr>`;

        try {
            const user = getUser();
            let response;

            if (user && idOf(user)) {
                response = await request(
                    '/cart/customer/' + encodeURIComponent(idOf(user))
                );
            } else {
                response = JSON.parse(
                    sessionStorage.getItem('apiq-guest-cart') || '[]'
                );
            }

            const data = unwrap(response);

            checkoutItems = Array.isArray(data)
                ? data
                : (
                    data?.items ??
                    data?.Items ??
                    data?.cart ??
                    data?.Cart ??
                    []
                );

            if (!checkoutItems.length) {
                itemsElement.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-3">
                        Giỏ hàng đang trống.
                        <a href="cart.html">Quay lại giỏ hàng</a>
                    </td>
                </tr>`;

                if (subtotalElement) subtotalElement.textContent = money(0);
                if (shippingElement) shippingElement.textContent = money(0);
                if (totalElement) totalElement.textContent = money(0);

                placeOrderButton.disabled = true;
                return;
            }

            checkoutTotal = 0;

            itemsElement.innerHTML = checkoutItems.map(item => {
                const name = cName(item);
                const quantity = Number(cQty(item)) || 1;
                const price = Number(cPrice(item)) || 0;

                const lineTotal = Number(
                    item.thanhTien ??
                    item.ThanhTien ??
                    item.total ??
                    item.Total ??
                    price * quantity
                );

                checkoutTotal += lineTotal;

                return `
                <tr>
                    <td>${esc(name)}</td>
                    <td class="text-end">${money(price)}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-end">${money(lineTotal)}</td>
                </tr>`;
            }).join('');

            const shipping = 0;
            const appliedCoupon = getAppliedCoupon();
            let discountAmount = 0;

            if (appliedCoupon && checkoutTotal > 0) {
                discountAmount = Math.round(checkoutTotal * (Number(appliedCoupon.percent || 0) / 100));
                const discountRow = $('#api-checkout-discount-row');
                const discountBadge = $('#api-checkout-discount-badge');
                const discountVal = $('#api-checkout-discount');
                if (discountRow) discountRow.style.display = 'table-row';
                if (discountBadge) discountBadge.textContent = `${appliedCoupon.code} -${appliedCoupon.percent}%`;
                if (discountVal) discountVal.textContent = `-${money(discountAmount)}`;

                const couponInput = $('#MaGiamGia') || $('[name="MaGiamGia"]');
                if (couponInput && !couponInput.value) {
                    couponInput.value = appliedCoupon.code;
                }
            } else {
                const discountRow = $('#api-checkout-discount-row');
                if (discountRow) discountRow.style.display = 'none';
            }

            const finalTotal = Math.max(0, checkoutTotal + shipping - discountAmount);

            if (subtotalElement) {
                subtotalElement.textContent = money(checkoutTotal);
            }

            if (shippingElement) {
                shippingElement.textContent = money(shipping);
            }

            if (totalElement) {
                totalElement.textContent = money(finalTotal);
            }

            console.log('[Checkout] Giỏ hàng:', checkoutItems);
            console.log('[Checkout] Tổng tiền:', finalTotal);

            const currentUser = getUser();

            console.log('[Checkout] User hiện tại:', currentUser);
            console.log(
                '[Checkout] Mã khách hàng:',
                currentUser ? idOf(currentUser) : null
            );
            console.log(
                '[Checkout] Giỏ hàng trong sessionStorage:',
                sessionStorage.getItem('apiq-guest-cart')
            );

        } catch (error) {
            console.error('[Checkout] Lỗi tải giỏ hàng:', error);

            itemsElement.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-3">
                    ${esc(error.message)}
                </td>
            </tr>`;

            placeOrderButton.disabled = true;
            return;
        }

        // ==================================================
        // 2. XỬ LÝ ĐẶT HÀNG
        // ==================================================
        placeOrderButton.onclick = async function (event) {
            event?.preventDefault();

            if (isSubmitting) return;

            const method = getPaymentMethod();

            if (!method) {
                showMessage(
                    'Vui lòng chọn phương thức thanh toán.',
                    'error'
                );
                return;
            }

            if (!checkoutItems.length) {
                showMessage('Giỏ hàng đang trống.', 'error');
                return;
            }

            // Lấy thông tin từ các ô nhập.
            const tenNguoiNhan = getValue(
                '[name="TenNguoiNhan"]',
                '#TenNguoiNhan',
                '[name="tenNguoiNhan"]',
                '#checkout-name',
                '[name="firstName"]'
            );

            const soDienThoai = getValue(
                '[name="SoDienThoai"]',
                '#SoDienThoai',
                '[name="soDienThoai"]',
                '#checkout-phone',
                '[name="phone"]'
            );

            const diaChi = getValue(
                '[name="DiaChi"]',
                '#DiaChi',
                '[name="diaChi"]',
                '#checkout-address',
                '[name="address"]'
            );

            const ghiChu = getValue(
                '[name="GhiChu"]',
                '#GhiChu',
                '[name="ghiChu"]',
                '[name="note"]'
            );

            const maGiamGia = getValue(
                '[name="MaGiamGia"]',
                '#MaGiamGia'
            ) || getAppliedCoupon()?.code || null;

            // Kiểm tra trước khi gọi API.
            if (!tenNguoiNhan || !soDienThoai || !diaChi) {
                showMessage(
                    'Vui lòng nhập đầy đủ tên người nhận, số điện thoại và địa chỉ giao hàng.',
                    'error'
                );
                return;
            }

            // Không log mật khẩu hoặc dữ liệu nhạy cảm.
            console.log('[Checkout] Thông tin giao hàng:', {
                tenNguoiNhan,
                soDienThoai,
                diaChi,
                phuongThuc: method
            });

            isSubmitting = true;
            placeOrderButton.disabled = true;

            const originalText = placeOrderButton.textContent;
            placeOrderButton.textContent = 'Đang tạo hóa đơn...';

            if (qrSection) qrSection.hidden = true;
            if (qrImage) qrImage.removeAttribute('src');

            try {
                // ==================================================
                // 3. GỬI YÊU CẦU TẠO HÓA ĐƠN
                // ==================================================
                const payload = {
                    TenNguoiNhan: tenNguoiNhan,
                    SoDienThoai: soDienThoai,
                    DiaChi: diaChi,
                    GhiChu: ghiChu,
                    PhuongThucThanhToan: method === 'VietQR'
                        ? 'ChuyenKhoan'
                        : 'COD',
                    MaGiamGia: maGiamGia
                };

                console.log('[Checkout] Payload:', payload);

                const response = await request('/thanh-toan', {
                    method: 'POST',
                    body: payload
                });

                const invoice = unwrap(response) || {};

                const invoiceId =
                    invoice.maHoaDon ??
                    invoice.MaHoaDon ??
                    invoice.maHD ??
                    invoice.MaHD ??
                    invoice.id ??
                    invoice.Id;

                const amount = Number(
                    invoice.tongTien ??
                    invoice.TongTien ??
                    invoice.total ??
                    invoice.Total ??
                    checkoutTotal
                );

                if (invoiceId == null || invoiceId === '') {
                    console.error(
                        '[Checkout] API không trả mã hóa đơn:',
                        invoice
                    );

                    throw new Error(
                        'Không nhận được mã hóa đơn từ API. ' +
                        'Hãy kiểm tra phản hồi của POST /thanh-toan.'
                    );
                }

                // ==================================================
                // 4. THANH TOÁN KHI NHẬN HÀNG
                // ==================================================
                if (method === 'COD') {
                    if (qrSection) qrSection.hidden = true;

                    showMessage(
                        `Đặt hàng thành công! Mã hóa đơn: ${invoiceId}. ` +
                        `Tổng tiền: ${money(amount)}. ` +
                        'Bạn sẽ thanh toán khi nhận hàng.',
                        'success'
                    );

                    return;
                }

                // ==================================================
                // 5. THANH TOÁN BẰNG QR
                // ==================================================
                const qr = await getVietQR(amount, invoiceId);

                if (!qr) {
                    const qrResponse = await request(
                        '/vietqr/test?amount=' +
                        encodeURIComponent(amount) +
                        '&maHoaDon=' +
                        encodeURIComponent(invoiceId)
                    );

                    const qrData = unwrap(qrResponse) || {};

                    qr =
                        qrData.qrCode ??
                        qrData.QRCode ??
                        qrData.qrUrl ??
                        qrData.QRUrl ??
                        qrData.paymentUrl ??
                        qrData.PaymentUrl;
                }

                if (!qr) {
                    throw new Error(
                        `Hóa đơn ${invoiceId} đã tạo nhưng không lấy được QR. ` +
                        'Hãy kiểm tra API VietQR trước khi tạo lại hóa đơn.'
                    );
                }

                if (qrImage) {
                    qrImage.src = qr;
                    qrImage.alt = `Mã QR thanh toán hóa đơn ${invoiceId}`;
                }

                if (qrSection) {
                    qrSection.hidden = false;
                } else {
                    const result = $id('api-payment-result');

                    if (result) {
                        result.insertAdjacentHTML(
                            'beforeend',
                            '<div id="api-qr-section" class="text-center mt-4">' +
                            '<p>Quét mã QR để thanh toán</p>' +
                            '<img id="api-qr-image" alt="Mã QR thanh toán" ' +
                            'style="max-width:300px;width:100%">' +
                            '</div>'
                        );

                        $id('api-qr-image').src = qr;
                    }
                }

                showMessage(
                    `Đã tạo hóa đơn ${invoiceId}. ` +
                    `Tổng tiền: ${money(amount)}. Vui lòng quét mã QR.`,
                    'success'
                );

            } catch (error) {
                console.error('[Checkout] Lỗi đặt hàng:', error);

                showMessage(
                    error.message || 'Không thể tạo hóa đơn.',
                    'error'
                );

            } finally {
                isSubmitting = false;
                placeOrderButton.disabled = false;
                placeOrderButton.textContent = originalText;
            }
        };
    }


    async function initContact() { const form = $('form'); if (!form || $('#api-contact-form')) return; form.id = 'api-contact-form'; }
    document.addEventListener('click', async e => {
        const add = e.target.closest('[data-add-cart]');

        if (add) {
            e.preventDefault();

            const id = Number(add.dataset.addCart);

            let book = state.books.find(
                x => Number(
                    x.maSach ?? x.MaSach ?? x.id ?? x.Id
                ) === id
            );

            if (!book) {
                try {
                    book = unwrap(await request('/sach/' + id));
                } catch (error) {
                    console.error('Lỗi lấy thông tin sách:', error);
                    notice('Không tải được thông tin sách.', 'error');
                    return;
                }
            }

            if (!book) {
                notice('Không tìm thấy sách.', 'error');
                return;
            }

            await handleAddBookToCart(book);
            return;
        } const fav = e.target.closest('[data-favorite]'); if (fav) { e.preventDefault(); try { await request('/sach-yeu-thich/' + fav.dataset.favorite, { method: 'POST' }); notice('Đã thêm vào yêu thích'); } catch (err) { notice(err.message, 'error'); } return; } const qty = e.target.closest('[data-qty]'); if (qty) { changeQty(qty.dataset.qty, Number(qty.dataset.delta)); return; } const rem = e.target.closest('[data-remove-cart]'); if (rem) { removeCart(rem.dataset.removeCart); return; } const rf = e.target.closest('[data-remove-favorite]'); if (rf) { try { await request('/sach-yeu-thich/' + rf.dataset.removeFavorite, { method: 'DELETE' }); notice('Đã bỏ yêu thích'); initFavorites(); } catch (err) { notice(err.message, 'error'); } return; } const od = e.target.closest('[data-order-detail]'); if (od) { try { const d = unwrap(await request('/HoaDon/chi-tiet/' + od.dataset.orderDetail)); $('#api-order-detail').innerHTML = `<h5 class="mt-4">Chi tiết hóa đơn #${od.dataset.orderDetail}</h5><pre class="bg-white p-3 rounded">${esc(JSON.stringify(d, null, 2))}</pre>`; } catch (err) { notice(err.message, 'error'); } return; } const er = e.target.closest('[data-edit-review]'); if (er) { editingReviewId = Number(er.dataset.editReview); const f = $('#api-review-form'); if (f) { f.elements.SoSao.value = er.dataset.reviewStars; f.elements.NoiDung.value = er.dataset.reviewText; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.querySelector('[type=submit]').textContent = 'Cập nhật đánh giá'; } return; } const dr = e.target.closest('[data-delete-review]'); if (dr) { try { await request('/danh-gia-sach/' + dr.dataset.deleteReview, { method: 'DELETE' }); notice('Đã xóa đánh giá'); showBook(); } catch (err) { notice(err.message, 'error'); } }
    });

    function initContactChat() {
        const guestView = $('#chat-guest-view');
        const authView = $('#chat-auth-view');

        const user = getUser();
        const isLoggedIn = isUserLoggedIn();

        if (!isLoggedIn || !user) {
            // Chưa đăng nhập -> Hiện view yêu cầu đăng nhập
            if (guestView) guestView.style.display = 'block';
            if (authView) authView.style.display = 'none';

            // Lưu liên kết quay lại sau khi đăng nhập
            $$('a[href="login.html"]').forEach(link => {
                link.addEventListener('click', () => {
                    sessionStorage.setItem('redirectAfterLogin', 'contact.html');
                });
            });
            return;
        }

        // Đã đăng nhập -> Hiện giao diện chat
        if (guestView) guestView.style.display = 'none';
        if (authView) authView.style.display = 'block';

        const currentUserId = Number(idOf(user));
        const currentUserName = user.tenKhachHang || user.TenKhachHang || user.tenDangNhap || user.TenDangNhap || 'Khách hàng';
        const currentUserEmail = user.email || user.Email || user.soDienThoai || user.SoDienThoai || `ID: #${currentUserId}`;
        const isCurrentUserAdmin = String(user.role || user.Role || '').toLowerCase() === 'admin' || currentUserId === 6;

        // Cập nhật thông tin người dùng trong sidebar
        const nameEl = $('#chat-current-user-name');
        const infoEl = $('#chat-current-user-info');
        if (nameEl) nameEl.textContent = currentUserName + (isCurrentUserAdmin ? ' (Admin)' : '');
        if (infoEl) infoEl.textContent = currentUserEmail;

        // Đối tác chat mặc định:
        // Nếu user thường: đối tác là Admin (ID = 6)
        // Nếu user là Admin: có thể chọn đối tác là khách hàng
        let partnerId = isCurrentUserAdmin ? 1 : 6;

        const adminSelectorBox = $('#chat-admin-selector-box');
        const customerSelect = $('#chat-customer-select');
        const headerTitle = $('#chat-header-title');
        const headerSubtitle = $('#chat-header-subtitle');
        const messagesContainer = $('#chat-messages-container');
        const sendForm = $('#chat-send-form');
        const messageInput = $('#chat-message-input');
        const sendBtn = $('#chat-send-btn');
        const refreshBtn = $('#chat-refresh-btn');

        if (isCurrentUserAdmin && adminSelectorBox && customerSelect) {
            adminSelectorBox.style.display = 'block';
            if (headerSubtitle) headerSubtitle.textContent = 'Quản trị viên trả lời tin nhắn của Khách hàng';

            // Tải danh sách khách hàng để admin lựa chọn
            loadCustomersForAdmin();
        }

        async function loadCustomersForAdmin() {
            try {
                const res = await request('/KhachHang/DanhSachTaiKhoan', {
                    headers: { 'X-User-Id': String(currentUserId) }
                });
                const list = unwrap(res) || [];
                const customers = list.filter(c => Number(c.maKhachHang ?? c.MaKhachHang) !== currentUserId);

                if (customers.length > 0) {
                    customerSelect.innerHTML = customers.map(c => {
                        const cId = Number(c.maKhachHang ?? c.MaKhachHang);
                        const cName = c.tenKhachHang ?? c.TenKhachHang ?? c.tenDangNhap ?? `Khách #${cId}`;
                        return `<option value="${cId}">#${cId} - ${esc(cName)}</option>`;
                    }).join('');

                    partnerId = Number(customerSelect.value) || 1;
                    loadMessages();
                } else {
                    customerSelect.innerHTML = '<option value="1">#1 - Khách hàng mặc định</option>';
                    partnerId = 1;
                    loadMessages();
                }
            } catch (err) {
                console.warn('Không tải được danh sách khách hàng:', err);
                customerSelect.innerHTML = `
                    <option value="1">#1 - Nguyễn Văn Nhất</option>
                    <option value="2">#2 - Phạm Văn Nhị</option>
                    <option value="3">#3 - Lê Hoàng Châu</option>
                `;
                partnerId = 1;
                loadMessages();
            }
        }

        if (customerSelect) {
            customerSelect.addEventListener('change', () => {
                partnerId = Number(customerSelect.value) || 1;
                const selectedText = customerSelect.options[customerSelect.selectedIndex]?.text || '';
                if (headerTitle) headerTitle.textContent = `Trò chuyện với ${selectedText}`;
                loadMessages();
            });
        }

        // Định dạng thời gian
        function formatChatTime(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${hours}:${minutes} - ${day}/${month}`;
        }

        // Lấy tin nhắn từ server
        let isFetching = false;
        async function loadMessages(showLoading = false) {
            if (isFetching) return;
            isFetching = true;

            if (showLoading && messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                        <div>Đang tải cuộc trò chuyện...</div>
                    </div>`;
            }

            try {
                const endpoint = `/TinNhan/history?user1=${encodeURIComponent(currentUserId)}&user2=${encodeURIComponent(partnerId)}`;
                const response = await request(endpoint, {
                    headers: { 'X-User-Id': String(currentUserId) }
                });

                const rawList = unwrap(response);
                const messages = Array.isArray(rawList) ? rawList : (rawList?.items || []);

                renderMessages(messages);

                // Lưu bản sao lưu vào localStorage phòng khi mất mạng
                localStorage.setItem(`bookstore_chat_${currentUserId}_${partnerId}`, JSON.stringify(messages));
            } catch (err) {
                console.warn('[Chat] Lỗi tải tin nhắn từ server:', err.message);

                // Đọc từ bản sao lưu
                try {
                    const cached = JSON.parse(localStorage.getItem(`bookstore_chat_${currentUserId}_${partnerId}`) || '[]');
                    renderMessages(cached);
                } catch {
                    renderMessages([]);
                }
            } finally {
                isFetching = false;
            }
        }

        function renderMessages(messages) {
            if (!messagesContainer) return;

            if (!messages || messages.length === 0) {
                const partnerName = isCurrentUserAdmin ? 'khách hàng' : 'Quản trị viên (Admin)';
                messagesContainer.innerHTML = `
                    <div class="text-center py-5 my-auto">
                        <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; font-size: 26px;">
                            <i class="fas fa-comments"></i>
                        </div>
                        <h6 class="fw-bold mb-1">Chưa có tin nhắn nào</h6>
                        <p class="text-muted small mb-3">Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi cùng ${partnerName}!</p>
                        <div class="badge bg-light text-secondary border px-3 py-2 fw-normal">
                            💡 Gợi ý: "Xin chào Admin, tôi cần hỗ trợ thông tin đơn hàng / mã giảm giá."
                        </div>
                    </div>`;
                return;
            }

            const html = messages.map(msg => {
                const senderId = Number(msg.nguoiGui ?? msg.NguoiGui);
                const content = msg.noiDung ?? msg.NoiDung ?? '';
                const time = formatChatTime(msg.thoiGianGui ?? msg.ThoiGianGui);
                const isMe = senderId === currentUserId;

                if (isMe) {
                    return `
                    <div class="chat-msg-row user">
                        <div class="chat-bubble user">
                            <div class="chat-text">${esc(content)}</div>
                            <span class="chat-time">${esc(time || 'Vừa xong')}</span>
                        </div>
                    </div>`;
                } else {
                    const senderLabel = isCurrentUserAdmin ? 'Khách' : 'Admin';
                    const avatarBg = isCurrentUserAdmin ? 'bg-secondary' : 'bg-primary';
                    const avatarIcon = isCurrentUserAdmin ? '<i class="fas fa-user"></i>' : '<i class="fas fa-user-shield"></i>';

                    return `
                    <div class="chat-msg-row admin">
                        <div class="chat-avatar-sm ${avatarBg} text-white me-2" title="${senderLabel}">
                            ${avatarIcon}
                        </div>
                        <div class="chat-bubble admin">
                            <div class="fw-bold small text-primary mb-1">${senderLabel}</div>
                            <div class="chat-text">${esc(content)}</div>
                            <span class="chat-time">${esc(time || '')}</span>
                        </div>
                    </div>`;
                }
            }).join('');

            // Kiểm tra vị trí cuộn
            const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;

            messagesContainer.innerHTML = html;

            if (isAtBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        // Xử lý gửi tin nhắn
        async function handleSendMessage(e) {
            e?.preventDefault();
            if (!messageInput) return;

            const text = messageInput.value.trim();
            if (!text) return;

            messageInput.value = '';
            if (sendBtn) sendBtn.disabled = true;

            const tempMsg = {
                nguoiGui: currentUserId,
                nguoiNhan: partnerId,
                noiDung: text,
                thoiGianGui: new Date().toISOString()
            };

            // Thêm tạm thời vào giao diện để trải nghiệm tức thì mượt mà
            appendMessageOptimistic(tempMsg);

            try {
                const payload = {
                    NguoiGui: currentUserId,
                    NguoiNhan: partnerId,
                    NoiDung: text
                };

                await request('/TinNhan/send', {
                    method: 'POST',
                    headers: { 'X-User-Id': String(currentUserId) },
                    body: payload
                });

                // Cập nhật lại danh sách chính thức
                await loadMessages(false);
            } catch (err) {
                console.error('[Chat] Lỗi gửi tin nhắn:', err);
                notice(err.message || 'Không thể gửi tin nhắn.', 'error');
            } finally {
                if (sendBtn) sendBtn.disabled = false;
                if (messageInput) messageInput.focus();
            }
        }

        function appendMessageOptimistic(msg) {
            if (!messagesContainer) return;
            const time = formatChatTime(msg.thoiGianGui);
            const msgHtml = `
            <div class="chat-msg-row user">
                <div class="chat-bubble user">
                    <div class="chat-text">${esc(msg.noiDung)}</div>
                    <span class="chat-time">${esc(time || 'Đang gửi...')}</span>
                </div>
            </div>`;
            messagesContainer.insertAdjacentHTML('beforeend', msgHtml);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        if (sendForm) {
            sendForm.onsubmit = handleSendMessage;
        }

        if (refreshBtn) {
            refreshBtn.onclick = () => {
                const icon = refreshBtn.querySelector('i');
                if (icon) icon.classList.add('fa-spin');
                loadMessages(true).finally(() => {
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                    }, 500);
                });
            };
        }

        // Tải tin nhắn lần đầu
        loadMessages(true);

        // Polling định kỳ mỗi 5 giây để nhận tin nhắn mới tự động
        const pollTimer = setInterval(() => {
            loadMessages(false);
        }, 5000);

        window.addEventListener('beforeunload', () => {
            clearInterval(pollTimer);
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        state.user = getUser();
        updateNav();

        if (
            location.pathname.endsWith('/shop.html') ||
            location.pathname.endsWith('shop.html')
        ) {
            const anchor =
                $('.container-fluid.product.py-5') ||
                $('.container.py-5');

            // Sử dụng ô tìm kiếm có sẵn trong template
            const search = $('#api-book-search');

            if (search) {
                search.placeholder = 'Nhập tên sách cần tìm...';
            }

            if (anchor && !$('#api-books-grid')) {
                const grid = document.createElement('div');
                grid.className = 'container py-4';

                grid.innerHTML = `
            <p id="api-book-status" class="text-muted"></p>
            <div class="row" id="api-books-grid"></div>
        `;

                anchor.before(grid);
            }
        }


        if (location.pathname.endsWith('/index.html') || location.pathname.endsWith('/') || location.pathname === '') { const anchor = $('.container-fluid.product.py-5'); if (anchor) { const grid = document.createElement('div'); grid.className = 'container py-4'; grid.innerHTML = '<h2 class="mb-4">Sách nổi bật</h2><div class="row" id="api-books-home"></div>'; anchor.before(grid); } }
        if (location.pathname.endsWith('cart.html')) {
            const tbody = document.querySelector('#api-cart-body');

            if (tbody) {
                renderGuestCart();
            }
            initCartCoupon();
        }
        bindBookViewMode(); setupPriceFilter();
        await loadCart(); await loadBooks(); await loadBookCategories();
        if (location.pathname.endsWith('login.html')) initLogin();
        if (location.pathname.endsWith('register.html')) initRegister();
        if (location.pathname.endsWith('verify-otp.html')) initOtp();
        if (location.pathname.endsWith('profile.html')) { try { await initProfile() } catch (e) { notice(e.message, 'error'); } }
        if (location.pathname.endsWith('favorites.html')) { try { await initFavorites() } catch (e) { notice(e.message, 'error'); } }
        if (location.pathname.endsWith('orders.html')) { try { await initOrders() } catch (e) { notice(e.message, 'error'); } }
        if (location.pathname.endsWith('book.html')) { try { await showBook() } catch (e) { notice(e.message, 'error'); } }
        if (location.pathname.endsWith('contact.html')) {
            initContactChat();
        }
        if (location.pathname.endsWith('checkout.html')) {
            console.log('[Checkout] Đã nhận diện trang thanh toán');

            try {
                await initCheckout();
            } catch (e) {
                console.error('[Checkout] Lỗi khởi tạo:', e);
                notice(e.message, 'error');
            }
        }
    });
})();
