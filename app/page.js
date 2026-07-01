"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Hero } from "../components/Hero";
import { Composer } from "../components/Composer";
import { MessageBubble, ThinkingBubble } from "../components/MessageBubble";
import { CheckoutWizard } from "../components/CheckoutWizard";
import { Lightbox } from "../components/Lightbox";
import { Toast } from "../components/Toast";
import { loadSession, saveSession, clearSession } from "../lib/sessionMemory";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");
  const [cart, setCart] = useState([]);
  const [knownProducts, setKnownProducts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [previousSession, setPreviousSession] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Change 5: session memory — load once on mount
  useEffect(() => {
    const s = loadSession();
    if (s && s.recipientName) setPreviousSession(s);
  }, []);

  const cartIds = new Set(cart.map((c) => c.productId));

  async function sendTurn(userText, { displayText } = {}) {
    if (!userText.trim() || loading) return;
    setSidebarOpen(false);

    const userMsg = { id: uid(), role: "user", content: userText, displayText };
    const streamId = uid();
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { id: streamId, role: "assistant", content: "", streaming: true, toolsCalled: [] }]);
    setInput("");
    setLoading(true);

    // Change 1: streaming SSE consumption
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          language,
          cart,
          knownProducts,
        }),
      });

      if (!res.ok || !res.body) {
        let errMsg = "Something went wrong.";
        try { const j = await res.json(); errMsg = j.error || errMsg; } catch {}
        finalizeStreamAsError(streamId, errMsg);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          let ev;
          try { ev = JSON.parse(raw); } catch { continue; }

          if (ev.type === "chunk") {
            setMessages((prev) =>
              prev.map((m) => (m.id === streamId ? { ...m, content: m.content + ev.text } : m))
            );
          } else if (ev.type === "tool") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamId ? { ...m, toolsCalled: [...(m.toolsCalled || []), ev.name] } : m
              )
            );
          } else if (ev.type === "done") {
            finalizeStream(streamId, ev, userText);
          } else if (ev.type === "error") {
            finalizeStreamAsError(streamId, ev.message);
          }
        }
      }
    } catch (err) {
      finalizeStreamAsError(streamId, err.message);
    } finally {
      setLoading(false);
    }
  }

  function finalizeStream(streamId, data, userText) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamId
          ? {
              ...m,
              streaming: false,
              toolsCalled: data.toolsCalled || m.toolsCalled,
              products: data.products || [],
              orders: data.orders || [],
              errors: data.errors || [],
            }
          : m
      )
    );

    if (data.products?.length) {
      setKnownProducts((prev) => {
        const merged = [...prev];
        for (const p of data.products) {
          if (p.id && !merged.find((m) => m.id === p.id)) merged.push(p);
        }
        return merged.slice(-40);
      });
    }

    if (data.orders?.length) {
      setCheckingOut(false);
      setCartOpen(false);
      setCart([]);
      // Change 5: persist session after a successful order
      saveSession({ lastOrderAt: Date.now() });
    }

    // Change 5: opportunistically capture recipient/city mentions for next-visit welcome-back
    const nameMatch = userText.match(/for (?:my\s+)?(\w+)/i);
    const cityMatch = userText.match(/\bin\s+([A-Z][a-zA-Z]+)/);
    if (nameMatch || cityMatch) {
      saveSession({
        recipientName: nameMatch ? nameMatch[1] : undefined,
        city: cityMatch ? cityMatch[1] : undefined,
      });
    }
  }

  function finalizeStreamAsError(streamId, message) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamId
          ? {
              ...m,
              streaming: false,
              content: m.content || `Aiyo, something went wrong: ${message}. Please try again.`,
              errors: [{ message }],
            }
          : m
      )
    );
    setLoading(false);
  }

  function handleSend() {
    sendTurn(input);
  }

  function handleNewConversation() {
    setMessages([]);
    setCart([]);
    setKnownProducts([]);
    setInput("");
    setSidebarOpen(false);
  }

  function handleAddToCart(product) {
    setCart((prev) => {
      if (prev.find((c) => c.productId === product.id)) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.image,
          qty: 1,
        },
      ];
    });
    setToastMsg(`Added "${product.name}" to cart 🎁`);
  }

  function handleUpdateQty(productId, qty) {
    setCart((prev) => prev.map((c) => (c.productId === productId ? { ...c, qty } : c)));
  }

  function handleRemoveFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function handleCheckout(payload) {
    setCheckingOut(true);
    const orderRequest = "```json ORDER_REQUEST\n" + JSON.stringify(payload, null, 2) + "\n```";
    const userText = `Please place this order:\n${orderRequest}`;
    const displayText = `Checking out ${payload.cart.length} item${
      payload.cart.length > 1 ? "s" : ""
    } for ${payload.recipient.name} in ${payload.recipient.city}.`;
    sendTurn(userText, { displayText });
  }

  // Change 4: budget chip → refine last search
  function handleRefineBudget(text) {
    sendTurn(text);
  }

  // Change 6: inline delivery date picker → feed choice back to Kapu
  function handleDeliveryDateChosen(date) {
    sendTurn(`Please use ${date} as the delivery date.`);
  }

  function handleWelcomeBackDismiss() {
    setPreviousSession(null);
    clearSession();
  }

  const showHero = messages.length === 0;

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectPrompt={(text) => sendTurn(text)}
        onShowHistory={() => setSidebarOpen(false)}
      />

      <div className="main-panel">
        <Header
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-inner">
            {showHero && (
              <Hero
                onSelectPrompt={(text) => {
                  if (previousSession) handleWelcomeBackDismiss();
                  sendTurn(text);
                }}
                previousSession={previousSession}
              />
            )}

            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onAddToCart={handleAddToCart}
                onOpenLightbox={setLightboxProduct}
                onRefineBudget={handleRefineBudget}
                onDeliveryDateChosen={handleDeliveryDateChosen}
                cartIds={cartIds}
              />
            ))}

            {loading && messages[messages.length - 1]?.content === "" && <ThinkingBubble />}
          </div>
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={loading}
          language={language}
        />
      </div>

      <button type="button" className="cart-fab" onClick={() => setCartOpen(true)}>
        🛍 {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
      </button>

      <CheckoutWizard
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        checkingOut={checkingOut}
      />

      <Lightbox
        product={lightboxProduct}
        onClose={() => setLightboxProduct(null)}
        onAddToCart={handleAddToCart}
        inCart={lightboxProduct && cartIds.has(lightboxProduct.id)}
      />

      <Toast message={toastMsg} onDismiss={() => setToastMsg("")} />
    </div>
  );
}
