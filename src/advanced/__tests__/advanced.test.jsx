import { fireEvent, render, screen } from "@testing-library/react";
import "react";
import { act } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App.tsx";

describe("advanced test", () => {
  describe.each([
    { type: "origin", loadFile: () => import("../../main.js") },
    { type: "advanced", loadFile: () => import("../main.advanced.tsx") },
  ])("$type 장바구니 시나리오 테스트", ({ loadFile, type }) => {
    let sel, addBtn, cartDisp, sum, stockInfo, module;

    beforeAll(async () => {
      // DOM 초기화
      document.body.innerHTML = '<div id="app"></div>';
      if (type === "advanced") {
        render(<App />);
      } else {
        module = await loadFile();
      }
      // 전역 변수 참조
      sel = document.getElementById("product-select");
      addBtn = document.getElementById("add-to-cart");
      cartDisp = document.getElementById("cart-items");
      sum = document.getElementById("cart-total");
      stockInfo = document.getElementById("stock-status");
    });

    afterAll(() => {
      document.body.innerHTML = "";
    });

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.setSystemTime(new Date("2024-10-14"));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("초기 상태: 상품 목록이 올바르게 그려졌는지 확인", () => {
      const selectElement = screen.getByRole("combobox");
      expect(selectElement).toBeDefined();
      expect(selectElement.tagName.toLowerCase()).toBe("select");
      expect(selectElement.children.length).toBe(5);

      // 첫 번째 상품 확인
      expect(selectElement.children[0].value).toBe("p1");
      expect(selectElement.children[0].textContent).toBe("상품1 - 10000원");
      expect(selectElement.children[0].disabled).toBe(false);

      // 마지막 상품 확인
      expect(selectElement.children[4].value).toBe("p5");
      expect(selectElement.children[4].textContent).toBe("상품5 - 25000원");
      expect(selectElement.children[4].disabled).toBe(false);

      // 재고 없는 상품 확인 (상품4)
      expect(sel.children[3].value).toBe("p4");
      expect(sel.children[3].textContent).toBe("상품4 - 15000원");
      expect(sel.children[3].disabled).toBe(true);
    });

    it("초기 상태: DOM 요소가 올바르게 생성되었는지 확인", async () => {
      const h1Title = screen.getByRole("heading", { level: 1, name: "장바구니" });
      const selectElement = screen.getByRole("combobox");
      const addButton = screen.getByRole("button", { name: "추가" });
      // const cartItems = screen.getByRole("list", { name: "장바구니 목록" });
      // const cartTotal = screen.getByRole("heading", { name: "총액: 0원" });
      // const stockStatus = screen.getByRole("heading", { name: "상품0: 10개" });

      expect(h1Title).toBeDefined();
      expect(selectElement).toBeDefined();
      expect(addButton).toBeDefined();
      // expect(cartItems).toBeDefined();
      // expect(cartTotal).toBeDefined();
      // expect(stockStatus).toBeDefined();
    });

    it("상품을 장바구니에 추가할 수 있는지 확인", () => {
      const selectElement = screen.getByRole("combobox");

      fireEvent.change(selectElement, { target: { value: "p1" } });
      fireEvent.click(addBtn);

      expect(cartDisp.children.length).toBe(1);
      expect(cartDisp.children[0].querySelector("span").textContent).toContain("상품1 - 10000원 x 1");
    });

    it("장바구니에서 상품 수량을 변경할 수 있는지 확인", () => {
      const increaseBtn = screen.getByTestId("plus-button");
      act(() => {
        increaseBtn.click();
      });
      expect(cartDisp.children[0].querySelector("span").textContent).toContain("상품1 - 10000원 x 2");
    });

    it("장바구니에서 상품을 삭제할 수 있는지 확인", () => {
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p1" } });
      });
      fireEvent.click(addBtn);
      const removeBtn = screen.getByTestId("remove-button");
      act(() => {
        removeBtn.click();
      });
      expect(cartDisp.children.length).toBe(0);
    });

    it("총액이 올바르게 계산되는지 확인", () => {
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p1" } });
      });
      fireEvent.click(addBtn);
      fireEvent.click(addBtn);
      expect(sum.textContent).toContain("총액: 20000원(포인트: 20)");
    });

    it("할인이 올바르게 적용되는지 확인", () => {
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p1" } });
      });
      for (let i = 0; i < 10; i++) {
        act(() => {
          fireEvent.click(addBtn);
        });
      }
      expect(sum.textContent).toContain("(10.0% 할인 적용)");
    });

    it("포인트가 올바르게 계산되는지 확인", () => {
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p2" } });
      });
      fireEvent.click(addBtn);
      expect(document.getElementById("loyalty-points").textContent).toContain("(포인트: 128)");
    });

    it("번개세일 기능이 정상적으로 동작하는지 확인", () => {
      //TODO: 모듈로 불러와서 테스트하는 형태, but 실제로 프러덕트에서는 실행되지 않는다면?
      //! 또한 실제 코드에서 delay 값이 바뀔 때 어떻게??
      // 조건 충족 - 0.3 미만 설정
      vi.spyOn(Math, "random").mockReturnValue(0.1);

      const randomDelay = 10000 * 0.1;
      const randomInterval = 30000;

      const spy = vi.spyOn(module, "luckyDiscount");
      module.luckyDiscount();

      // 초기 상품 가격 확인
      expect(sel.textContent).toContain("상품1 - 10000원");

      // 번개세일 기능 호출
      vi.advanceTimersByTime(randomInterval + randomDelay);

      // 번개세일 기능 호출 확인
      expect(spy).toHaveBeenCalled();
      // alert 호출 확인
      expect(window.alert).toHaveBeenCalled();
      // alert 메세지 확인
      expect(window.alert).toHaveBeenCalledWith("번개세일! 상품1이(가) 20% 할인 중입니다!");

      // 상품 가격 변경 확인
      expect(sel.textContent).toContain("상품1 - 8000원");
    });

    it("추천 상품 알림이 표시되는지 확인", () => {
      //TODO: 모듈로 불러와서 테스트하는 형태, but 실제로 프러덕트에서는 실행되지 않는다면?
      // 조건 충족, 추가버튼을 통해 마지막으로 추가한 상품이 있어야함
      // p1 이 마지막이면 find를 통해 만족하는 첫 번쨰 요소는 p2가 됨
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p1" } });
      });
      fireEvent.click(addBtn);

      vi.spyOn(Math, "random").mockReturnValue(0.1);

      const randomDelay = 20000 * 0.1;
      const randomInterval = 60000;

      const spy = vi.spyOn(module, "suggestAdditionalDiscount");
      module.suggestAdditionalDiscount();

      // 추가 할인 기능 호출
      vi.advanceTimersByTime(randomInterval + randomDelay);

      // 추가 할인 기능 호출 확인
      expect(spy).toHaveBeenCalled();
      // alert 호출 확인
      expect(window.alert).toHaveBeenCalled();

      // alert 메세지 확인
      expect(window.alert).toHaveBeenCalledWith("상품2은(는) 어떠세요? 지금 구매하시면 5% 추가 할인!");

      // 상품 가격 변경 확인
      expect(sel.textContent).toContain("상품2 - 19000원");
    });

    it("화요일 할인이 적용되는지 확인", () => {
      const mockDate = new Date("2024-10-15"); // 화요일
      vi.setSystemTime(mockDate);
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p1" } });
      });
      fireEvent.click(addBtn);
      expect(document.getElementById("cart-total").textContent).toContain("(10.0% 할인 적용)");
    });

    it("재고가 부족한 경우 추가되지 않는지 확인", () => {
      // p4 상품 선택 (재고 없음)
      const selectElement = screen.getByRole("combobox");
      fireEvent.change(selectElement, { target: { value: "p4" } });
      fireEvent.click(addBtn);

      // p4 상품이 장바구니에 없는지 확인
      const p4InCart = Array.from(cartDisp.children).some((item) => item.id === "p4");
      expect(p4InCart).toBe(false);
      expect(stockInfo.textContent).toContain("상품4: 품절");
    });

    it("재고가 부족한 경우 추가되지 않고 알림이 표시되는지 확인", () => {
      const selectElement = screen.getByRole("combobox");
      act(() => {
        fireEvent.change(selectElement, { target: { value: "p5" } });
      });
      fireEvent.click(addBtn);

      // p5 상품이 장바구니에 추가되었는지 확인
      const p5InCart = Array.from(cartDisp.children).some((item) => item.id === "p5");
      expect(p5InCart).toBe(true);

      // 수량 증가 버튼 찾기
      const increaseBtn = cartDisp.querySelector('#p5 .quantity-change[data-change="1"]');
      expect(increaseBtn).not.toBeNull();

      // 수량을 10번 증가시키기
      for (let i = 0; i < 10; i++) {
        act(() => {
          increaseBtn.click();
        });
      }

      // 11번째 클릭 시 재고 부족 알림이 표시되어야 함
      increaseBtn.click();

      // 재고 부족 알림이 표시되었는지 확인
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("재고가 부족합니다"));

      // 장바구니의 상품 수량이 10개인지 확인
      const itemQuantity = cartDisp.querySelector("#p5 span").textContent;
      expect(itemQuantity).toContain("x 10");

      // 재고 상태 정보에 해당 상품이 재고 부족으로 표시되는지 확인
      expect(stockInfo.textContent).toContain("상품5: 품절");
    });
  });
});
