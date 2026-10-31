(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const money = (value) => new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
  const starterProducts = [
    {id:"p1",name:"Chroma Heat",category:"Chroma",price:35000,stock:4,glyph:"⚔"},
    {id:"p2",name:"Eternal III",category:"Godly",price:18000,stock:7,glyph:"🗡"},
    {id:"p3",name:"Elderwood Scythe",category:"Ancient",price:42000,stock:2,glyph:"⚒"},
    {id:"p4",name:"Amerilaser",category:"Vintage",price:15000,stock:5,glyph:"✦"},
    {id:"p5",name:"Chroma Luger",category:"Chroma",price:30000,stock:3,glyph:"⌁"},
    {id:"p6",name:"Darkbringer",category:"Godly",price:25000,stock:6,glyph:"⚔"}
  ];
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
  let products = read("mm2vault_products", starterProducts);
  let cart = read("mm2vault_cart", []);
  let orders = read("mm2vault_orders", []);
  let category = "All";
  let query = "";
  let sort = "featured";
  let toastTimer;
  const save = () => {
    localStorage.setItem("mm2vault_products", JSON.stringify(products));
    localStorage.setItem("mm2vault_cart", JSON.stringify(cart));
    localStorage.setItem("mm2vault_orders", JSON.stringify(orders));
  };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const showToast = (message) => {
    const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };
  const productById = (id) => products.find((item) => item.id === id);
  const cartQty = () => cart.reduce((sum, row) => sum + row.qty, 0);
  const totalStock = () => products.reduce((sum, item) => sum + item.stock, 0);
  function renderProducts() {
    let list = products.filter((item) => (category === "All" || item.category === category) && item.name.toLowerCase().includes(query));
    if (sort === "price-low") list.sort((a,b) => a.price-b.price);
    if (sort === "price-high") list.sort((a,b) => b.price-a.price);
    if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name));
    $("#productCount").textContent = String(list.length).padStart(2,"0");
    $("#showingCount").textContent = list.length;
    $("#heroStock").textContent = totalStock();
    $("#productGrid").innerHTML = list.length ? list.map((item,index) => `
      <article class="product-card">
        <div class="product-visual"><span class="visual-index">ITEM / ${String(index+1).padStart(2,"0")}</span><span class="visual-category">${escapeHTML(item.category.toUpperCase())}</span><span class="weapon-glyph">${escapeHTML(item.glyph || "⚔")}</span><span class="stock-flag ${item.stock===0?"out":""}">${item.stock===0?"OUT OF STOCK":item.stock+" IN STOCK"}</span></div>
        <div class="product-info"><div class="product-meta"><span>MM2 COLLECTIBLE</span><span>NO. ${String(index+1).padStart(3,"0")}</span></div><h3>${escapeHTML(item.name)}</h3><div class="product-bottom"><span class="price">${money(item.price)}</span><button class="add-button" data-add="${escapeHTML(item.id)}" ${item.stock===0?"disabled":""}>＋ Add to cart</button></div></div>
      </article>`).join("") : '<div class="empty-results">Tidak ada item yang cocok. Coba kata kunci atau kategori lain.</div>';
    $$("[data-add]").forEach((button) => button.addEventListener("click", () => addToCart(button.dataset.add)));
  }
  function renderCart() {
    const count = cartQty();
    $("#cartCount").textContent = count; $("#drawerCount").textContent = count;
    $("#cartItems").innerHTML = cart.map((row) => {
      const item = productById(row.id); if (!item) return "";
      return `<div class="cart-row"><div class="cart-thumb">${escapeHTML(item.glyph || "⚔")}</div><div class="cart-item-info"><strong>${escapeHTML(item.name)}</strong><small>${money(item.price)} / unit</small><div class="qty-control"><button data-qty="${item.id}" data-delta="-1" aria-label="Kurangi">−</button><span>${row.qty}</span><button data-qty="${item.id}" data-delta="1" aria-label="Tambah" ${row.qty>=item.stock?"disabled":""}>＋</button></div></div><div class="cart-line-end"><b>${money(item.price*row.qty)}</b><button class="remove-item" data-remove="${item.id}">Remove</button></div></div>`;
    }).join("");
    const subtotal = cart.reduce((sum,row) => { const item=productById(row.id); return sum+(item?item.price*row.qty:0); },0);
    $("#cartSubtotal").textContent=money(subtotal); $("#cartTotal").textContent=money(subtotal);
    $("#cartEmpty").classList.toggle("show",cart.length===0);
    $("#cartSummary").classList.toggle("hidden",cart.length===0);
    $$("[data-qty]").forEach((button) => button.addEventListener("click", () => changeQty(button.dataset.qty, Number(button.dataset.delta))));
    $$("[data-remove]").forEach((button) => button.addEventListener("click", () => removeFromCart(button.dataset.remove)));
  }
  function addToCart(id) {
    const item=productById(id); if(!item || item.stock<1) return;
    const row=cart.find((entry)=>entry.id===id);
    if(row) { if(row.qty>=item.stock) return showToast("Jumlah melebihi stok tersedia."); row.qty++; }
    else cart.push({id,qty:1});
    save(); renderCart(); showToast(item.name+" ditambahkan ke keranjang.");
  }
  function changeQty(id,delta) {
    const row=cart.find((entry)=>entry.id===id), item=productById(id); if(!row||!item) return;
    row.qty=Math.min(item.stock,row.qty+delta);
    if(row.qty<=0) cart=cart.filter((entry)=>entry.id!==id);
    save(); renderCart();
  }
  function removeFromCart(id) { cart=cart.filter((row)=>row.id!==id); save(); renderCart(); showToast("Item dihapus dari keranjang."); }
  function renderDashboard() {
    $("#statProducts").textContent=products.length;
    $("#statStock").textContent=totalStock();
    $("#statOrders").textContent=orders.length;
    $("#statRevenue").textContent=money(orders.reduce((sum,order)=>sum+order.total,0));
    $("#inventoryCount").textContent=products.length+" ITEMS";
    $("#inventoryBody").innerHTML=products.length?products.map((item)=>`<tr><td>${escapeHTML(item.name)}</td><td><span class="category-label">${escapeHTML(item.category)}</span></td><td>${money(item.price)}</td><td class="${item.stock<=2?"stock-low":""}">${item.stock}</td><td><button class="table-action" data-edit="${item.id}">Edit</button><button class="table-action" data-delete="${item.id}">×</button></td></tr>`).join(""):'<tr><td colspan="5" class="table-empty">Belum ada item.</td></tr>';
    $("#ordersList").innerHTML=orders.length?orders.slice(0,6).map((order)=>`<div class="order-row"><div class="order-avatar">#${escapeHTML(order.id.slice(-2))}</div><div class="order-details"><strong>Demo order ${escapeHTML(order.id)}</strong><small>${escapeHTML(order.date)} · ${order.items} item</small></div><div><div class="order-amount">${money(order.total)}</div><div class="order-status">COMPLETED</div></div></div>`).join(""):'<div class="orders-empty">Belum ada order demo.<br>Checkout keranjang untuk membuat simulasi order.</div>';
    $$("[data-edit]").forEach((button)=>button.addEventListener("click",()=>openProductModal(button.dataset.edit)));
    $$("[data-delete]").forEach((button)=>button.addEventListener("click",()=>deleteProduct(button.dataset.delete)));
  }
  function openCart() { $("#cartDrawer").classList.add("open"); $("#drawerBackdrop").classList.add("open"); $("#cartDrawer").setAttribute("aria-hidden","false"); }
  function closeCart() { $("#cartDrawer").classList.remove("open"); $("#drawerBackdrop").classList.remove("open"); $("#cartDrawer").setAttribute("aria-hidden","true"); }
  function openProductModal(id) {
    const item=id?productById(id):null;
    $("#modalTitle").textContent=item?"Edit item":"Add new item";
    $("#editProductId").value=item?item.id:""; $("#formName").value=item?item.name:"";
    $("#formCategory").value=item?item.category:"Chroma"; $("#formPrice").value=item?item.price:""; $("#formStock").value=item?item.stock:"";
    $("#modalBackdrop").classList.add("open");
  }
  function closeProductModal() { $("#modalBackdrop").classList.remove("open"); $("#productForm").reset(); }
  function deleteProduct(id) {
    const item=productById(id); if(!item) return;
    if(!confirm("Hapus "+item.name+" dari catalog demo?")) return;
    products=products.filter((entry)=>entry.id!==id); cart=cart.filter((entry)=>entry.id!==id);
    save(); renderAll(); showToast("Item dihapus dari catalog.");
  }
  function checkout() {
    if(!cart.length) return;
    const total=cart.reduce((sum,row)=>{const item=productById(row.id);return sum+(item?item.price*row.qty:0);},0);
    for(const row of cart) { const item=productById(row.id); if(!item||row.qty>item.stock) return showToast("Stok berubah. Periksa kembali keranjang."); }
    const items=cartQty();
    cart.forEach((row)=>{const item=productById(row.id);item.stock-=row.qty;});
    const id="MV-"+String(Date.now()).slice(-6);
    orders.unshift({id,total,items,date:new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})});
    cart=[];save();renderAll();closeCart();showToast("Demo order "+id+" berhasil dibuat.");
  }
  function renderAll(){renderProducts();renderCart();renderDashboard();}
  $$(".nav-link[data-view]").forEach((button)=>button.addEventListener("click",()=>{
    $$(".nav-link[data-view]").forEach((link)=>link.classList.toggle("active",link===button));
    $$(".view").forEach((view)=>view.classList.toggle("active",view.id===(button.dataset.view==="store"?"storeView":"dashboardView")));
    $("#pageCrumb").textContent=button.dataset.view==="store"?"Marketplace":"Dashboard";
    $("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
  }));
  $("#categoryFilters").addEventListener("click",(event)=>{const button=event.target.closest("[data-category]");if(!button)return;category=button.dataset.category;$$(".filter-chip").forEach((chip)=>chip.classList.toggle("active",chip===button));renderProducts();});
  $("#searchInput").addEventListener("input",(event)=>{query=event.target.value.trim().toLowerCase();renderProducts();});
  $("#sortSelect").addEventListener("change",(event)=>{sort=event.target.value;renderProducts();});
  $("#openCart").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#drawerBackdrop").addEventListener("click",closeCart);
  $("#checkoutBtn").addEventListener("click",checkout);
  $("#addProductBtn").addEventListener("click",()=>openProductModal());
  $("#closeModal").addEventListener("click",closeProductModal);$("#cancelModal").addEventListener("click",closeProductModal);
  $("#modalBackdrop").addEventListener("click",(event)=>{if(event.target===$("#modalBackdrop"))closeProductModal();});
  $("#productForm").addEventListener("submit",(event)=>{
    event.preventDefault();
    const id=$("#editProductId").value;
    const data={name:$("#formName").value.trim(),category:$("#formCategory").value,price:Number($("#formPrice").value),stock:Number($("#formStock").value)};
    if(!data.name||!Number.isFinite(data.price)||data.price<1||!Number.isInteger(data.stock)||data.stock<0)return;
    if(id){Object.assign(productById(id),data);showToast("Item berhasil diperbarui.");}
    else{products.unshift({id:"p"+Date.now(),glyph:"⚔",...data});showToast("Item baru ditambahkan.");}
    save();renderAll();closeProductModal();
  });
  $("#themeToggle").addEventListener("click",()=>{document.body.classList.toggle("light");const light=document.body.classList.contains("light");localStorage.setItem("mm2vault_theme",light?"light":"dark");$("#themeName").textContent=light?"Light":"Dark";});
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  document.addEventListener("keydown",(event)=>{if(event.key==="Escape"){closeCart();closeProductModal();$("#sidebar").classList.remove("open");}if(event.key==="/"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){event.preventDefault();$("#searchInput").focus();}});
  if(localStorage.getItem("mm2vault_theme")==="light"){document.body.classList.add("light");$("#themeName").textContent="Light";}
  renderAll();
})();