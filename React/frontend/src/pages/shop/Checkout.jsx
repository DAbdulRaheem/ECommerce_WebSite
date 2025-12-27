import { useState } from "react";
import { Container, Card, Button, Spinner } from "react-bootstrap";
import { paymentService } from "../../services/api";
import { toast } from "react-toastify";

const Checkout = () => {
  const [loading, setLoading] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    return localStorage.getItem("selected_address_id") || null;
  });

  const [addresses, setAddresses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("addresses") || "[]");
    } catch {
      return [];
    }
  });

  // simple form state for adding a new address
  const [newLabel, setNewLabel] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");

  const persistAddresses = (next) => {
    setAddresses(next);
    localStorage.setItem("addresses", JSON.stringify(next));
  };

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    localStorage.setItem("selected_address_id", id);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressLine.trim()) {
      toast.error("Please enter an address");
      return;
    }
    const id = Date.now().toString();
    const addr = {
      id,
      label: newLabel.trim() || "My Address",
      line: newAddressLine.trim(),
      city: newCity.trim(),
      state: newState.trim(),
    };
    const next = [addr, ...addresses];
    persistAddresses(next);
    // preselect newly added address
    handleAddressSelect(id);
    setNewLabel("");
    setNewAddressLine("");
    toast.success("Address saved");
  };

  const handleRemoveAddress = (id) => {
    const next = addresses.filter((a) => a.id !== id);
    persistAddresses(next);
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
      localStorage.removeItem("selected_address_id");
    }
  };

  const handlePayment = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address!");
      return;
    }

    setLoading(true);
    try {
      const res = await paymentService.initiatePayu({
        address_id: selectedAddressId,
      });

      const params = res.data;

      const form = document.createElement("form");
      form.method = "POST";
      form.action = params.action;

      const keys = [
        "key",
        "txnid",
        "amount",
        "productinfo",
        "firstname",
        "email",
        "phone",
        "surl",
        "furl",
        "hash",
        "udf1",
        "udf2",
      ];

      keys.forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = params[key] || "";
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      toast.error("Failed to start payment");
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ width: "600px" }} className="p-4 shadow border-0">
        <h3 className="mb-4 text-center">Checkout</h3>
        <Card className="mt-3 p-3 border-0 shadow-sm"></Card>
        <h3 style={{ justifyContent: "center", display: "flex" }}>
          {" "}
          Add Address to Place the Order
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAddressLine.trim()) {
              toast.error("Please enter an address");
              return;
            }
            // call existing handler to persist/select the address
            handleAddAddress(e);
            // ensure all inputs are cleared after successful save
            setNewLabel("");
            setNewAddressLine("");
            setNewCity("");
            setNewState("");
          }}
          className="mb-3"
        >
          <div className="mb-2">
            <input
              className="form-control"
              placeholder="Label (optional, e.g. Home)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <div className="mb-2 gap-2 d-flex flex-column">
            <input
              className="form-control"
              placeholder="Address Line"
              value={newAddressLine}
              onChange={(e) => setNewAddressLine(e.target.value)}
            />
            <input
              className="form-control"
              placeholder="City"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
            />
            <input
              className="form-control"
              placeholder="State"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
            />
          </div>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary">
              Save Address
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setNewLabel("");
                setNewAddressLine("");
                setNewCity("");
                setNewState("");
              }}
            >
              Clear
            </Button>
          </div>
        </form>

        <h5>Saved addresses</h5>
        {addresses.length === 0 ? (
          <p className="text-muted">No saved addresses yet.</p>
        ) : (
          <div className="mb-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={
                  "d-flex align-items-start justify-content-between p-2 border rounded mb-2 " +
                  (addr.id === selectedAddressId ? "" : "")
                }
              >
                <div>
                  <div className="fw-bold">{addr.label}</div>
                  <div className="text-muted">{addr.line}</div>
                  <div className="text-muted">{addr.city}</div>
                  <div className="text-muted">{addr.state}</div>
                </div>
                <div className="d-flex flex-column align-items-end">
                  <div>
                    <input
                      type="radio"
                      name="selected_address"
                      checked={addr.id === selectedAddressId}
                      onChange={() => handleAddressSelect(addr.id)}
                    />{" "}
                    Select
                  </div>
                  <button
                    className="btn btn-sm btn-link text-danger mt-1"
                    onClick={() => handleRemoveAddress(addr.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAddress && (
          <>
            <hr />
            <h6>Selected address</h6>
            <div className="mb-3 p-2 border rounded">
              <div className="fw-bold">{selectedAddress.label}</div>
              <div className="text-muted">{selectedAddress.line}</div>
              <div className="text-muted">{selectedAddress.city}</div>
              <div className="text-muted">{selectedAddress.state}</div>
            </div>
          </>
        )}

        <hr />

        <div className="text-center mt-3">
          <p className="text-muted">Total will be calculated at payment.</p>
          <Button
            variant="success"
            size="lg"
            onClick={handlePayment}
            disabled={loading || !selectedAddressId}
            className="w-100"
          >
            {loading ? <Spinner size="sm" /> : "Proceed to Pay"}
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default Checkout;
