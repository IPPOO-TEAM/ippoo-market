import { describe, it, expect } from "vitest";
import { getInvoiceNumber, esc } from "../invoice-pdf";

describe("Invoice PDF Helpers", () => {
  it("should generate consistent invoice numbers", () => {
    const num1 = getInvoiceNumber("test-slug", "order-123", 1700000000000);
    const num2 = getInvoiceNumber("test-slug", "order-123", 1700000000000);
    expect(num1).toBe(num2);
    expect(num1).toMatch(/^INV-\d{4}-\d{4}$/);
  });

  it("should properly escape special HTML characters to prevent XSS", () => {
    const dangerousInput = `<script>alert('XSS "attack"')</script> & "me" 'too'`;
    const escaped = esc(dangerousInput);
    expect(escaped).not.toContain("<");
    expect(escaped).not.toContain(">");
    expect(escaped).not.toContain('"');
    expect(escaped).not.toContain("'");
    expect(escaped).toBe(
      "&lt;script&gt;alert(&#39;XSS &quot;attack&quot;&#39;)&lt;/script&gt; &amp; &quot;me&quot; &#39;too&#39;"
    );
  });
});
