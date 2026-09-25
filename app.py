import streamlit as st

# Configure the visual presentation of the browser/PWA window
st.set_page_config(page_title="KnitMixer - Needle Builder", page_icon="🧶", layout="centered")

st.title("🧶 ChiaoGoo Needle Configurator")
st.write("Mix and match your parts. Your selections are automatically verified for compatibility.")

# 1. DATABASE SETUP (Using real Shopify Variant IDs from your wife's store)
TIPS_DB = {
    "1.5mm [M]": {"group": "Mini", "id": "6523146109270"},
    "2.5mm [M]": {"group": "Mini", "id": "6523146240342"},
    "3.5mm [S]": {"group": "Small", "id": "6523146371414"},
    "5.0mm [S]": {"group": "Small", "id": "6523146502486"},
    "5.5mm [L]": {"group": "Large", "id": "6523146535254"},
    "10.0mm [L]": {"group": "Large", "id": "6523146764630"},
}

CABLES_DB = {
    "14in TWIST Red (Mini)": {"group": "Mini", "id": "6523138670934"},
    "14in TWIST Red (Small)": {"group": "Small", "id": "6523138834774"},
    "14in TWIST Red (Large)": {"group": "Large", "id": "6523139031382"},
    "14in SWIV360 Silver (Small)": {"group": "Small", "id": "6523137786198"},
    "14in SWIV360 Silver (Large)": {"group": "Large", "id": "6523138081110"},
}

ADAPTERS_DB = {
    "Small Tip to Mini Cable": "6523146994006",
    "Large Tip to Small Cable": "6523146961238"
}

# 2. USER SELECTION INTERFACE
selected_tip_name = st.selectbox("1. Choose Your Needle Tip Diameter:", list(TIPS_DB.keys()))
selected_cable_name = st.selectbox("2. Choose Your Cable Style & Length:", list(CABLES_DB.keys()))

# Extract group classifications and variant IDs
tip_group = TIPS_DB[selected_tip_name]["group"]
tip_id = TIPS_DB[selected_tip_name]["id"]

cable_group = CABLES_DB[selected_cable_name]["group"]
cable_id = CABLES_DB[selected_cable_name]["id"]

# 3. INTERACTION & COMPATIBILITY LOGIC
cart_variants = [f"{tip_id}:1", f"{cable_id}:1"]
adapter_needed = None
is_valid = True

if tip_group == cable_group:
    st.success(f"✅ Perfect Match! Both items belong to the ChiaoGoo '{tip_group}' ecosystem.")
else:
    # Check if a physical adapter exists to bridge the mismatch
    if tip_group == "Small" and cable_group == "Mini":
        adapter_needed = "Small Tip to Mini Cable"
    elif tip_group == "Large" and cable_group == "Small":
        adapter_needed = "Large Tip to Small Cable"
    else:
        is_valid = False
        st.error(f"⚠️ Incompatible: There is no adapter available to connect a {tip_group} Tip directly to a {cable_group} Cable.")

# 4. ADAPTER INTEGRATION AND FINAL CHECKOUT GENERATION
if is_valid:
    if adapter_needed:
        st.warning(f"💡 Notice: You have selected a {tip_group} Tip with a {cable_group} Cable. We have automatically added a '{adapter_needed}' to your cart to make them fit seamlessly!")
        adapter_id = ADAPTERS_DB[adapter_needed]
        cart_variants.append(f"{adapter_id}:1")
    
    # Compile the final multi-item Shopify permalink
    cart_slug = ",".join(cart_variants)
    shopify_checkout_url = f"https://thelittleknittingcompany.co.uk{cart_slug}"
    
    st.write("---")
    st.link_button("🛒 Send Complete Set to Shop Cart", shopify_checkout_url, use_container_width=True)
