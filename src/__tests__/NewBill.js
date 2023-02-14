/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import store from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  const html = NewBillUI();
  document.body.innerHTML = html;
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("when handleChangeFile is called", () => {
      test(" updateBill is called", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: store,
          localStorage: localStorageMock,
        });
        jest.mock("../containers/NewBill");
        const handleChangeFile = jest.fn((e) => {
          newBill.handleChangeFile(e);
        });
        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput);
        expect(handleChangeFile).toHaveBeenCalled();
      });
    });
    describe("when the form is submitted", () => {
      test("we are on the Bills page", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: store,
          localStorage: localStorageMock,
        });
        jest.mock("../containers/NewBill");
        const handleSubmit = jest.fn((e) => {
          newBill.handleSubmit(e);
        });
        const formNewBill = screen.getByTestId("form-new-bill");
        formNewBill.addEventListener("submit", handleSubmit);
        fireEvent.submit(formNewBill);
        expect(handleSubmit).toHaveBeenCalled();
        expect(global.window.location.href).toContain(ROUTES_PATH.Bills);
      });
    });
  });
});
