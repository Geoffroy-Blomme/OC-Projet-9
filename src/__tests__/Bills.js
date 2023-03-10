/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { error } from "console";
import Bills from "../containers/Bills";
import router from "../app/Router.js";
import store from "../__mocks__/store";

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
  window.onNavigate(ROUTES_PATH.Bills);
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      error(dates);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    describe("When I click on the new Bill button", () => {
      test("The new bill page is opened", () => {
        const body = document.createElement("body");
        const template = document.createElement("template");
        template.innerHTML = ` <form data-testid="form-new-bill"> </form>`;
        body.appendChild(template);
        const bills = new Bills({ document, onNavigate });
        bills.handleClickNewBill();
        expect(global.window.location.href).toContain(ROUTES_PATH.NewBill);
      });
    });

    describe("When I click on the icon eye", () => {
      test("handleClickIconEye should be called", async () => {
        await waitFor(() => screen.getAllByTestId("icon-eye"));
        const iconEye = screen.getAllByTestId("icon-eye");
        const bills = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: localStorageMock,
        });
        const spy = jest.spyOn(bills, "handleClickIconEye");
        iconEye[0].click();
        expect(spy).toHaveBeenCalled();
      });
      test("modaleFile should be visible", async () => {
        await waitFor(() => screen.getAllByTestId("icon-eye"));
        const iconEye = screen.getAllByTestId("icon-eye");
        iconEye[0].click();
        const modaleFile = document.querySelector("#modaleFile");
        const modaleFileDisplay = window.getComputedStyle(modaleFile).display;
        expect(modaleFileDisplay).not.toBe("none");
      });
    });

    describe("getBills is called", () => {
      test("it should return the bills that are in the store", () => {
        const bills = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: localStorageMock,
        });
        const firstBill = {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a???f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "H??tel et logement",
          commentary: "s??minaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        };
        const secondBill = {
          id: "BeKy5Mo4jkmdfPGYpTxZ",
          vat: "",
          amount: 100,
          name: "test1",
          fileName: "1592770761.jpeg",
          commentary: "plop",
          pct: 20,
          type: "Transports",
          email: "a@a",
          fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a???61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
          date: "2001-01-01",
          status: "refused",
          commentAdmin: "en fait non",
        };
        // On mock le store pour qu'il ait 2 tickets.
        store.bills = jest.fn(() => ({
          list() {
            return Promise.resolve([firstBill, secondBill]);
          },
        }));
        expect(bills.getBills()).toEqual(
          Promise.resolve(firstBill, secondBill)
        );
      });
      test("if the data was corrupted, the data is unformatted", async () => {
        const bills = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: localStorageMock,
        });
        const corruptedBill = {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a???f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "H??tel et logement",
          commentary: "s??minaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "23 javnier 2004",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        };
        // we mock the store so that it contains only the corrupted Bill
        store.bills = jest.fn(() => ({
          list() {
            return Promise.resolve([corruptedBill]);
          },
        }));
        let returnedBill;
        const res = await bills.getBills().then((bill) => {
          returnedBill = bill;
        });
        expect(returnedBill[0].date).toEqual(corruptedBill.date);
      });
    });
    describe("When the store's list returns a 404 error", () => {
      test("The error and its type are displayed", async () => {
        store.bills = jest.fn(() => ({
          list() {
            return Promise.reject(new Error("Erreur 404"));
          },
        }));

        // DOM construction
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        // await response
        const message = await screen.getByText(/Erreur 404/);

        // expected result
        expect(message).toBeTruthy();
      });
    });

    describe("When the store's list returns a 500 error", () => {
      test("The error and its type are displayed", async () => {
        store.bills = jest.fn(() => ({
          list() {
            return Promise.reject(new Error("Erreur 500"));
          },
        }));

        // DOM construction
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        // await response
        const message = await screen.getByText(/Erreur 500/);

        // expected result
        expect(message).toBeTruthy();
      });
    });
  });
});
