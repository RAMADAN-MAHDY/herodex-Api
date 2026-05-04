import ShippingRate from '../models/ShippingRate.js';

// Controller function to update the shipping rate
export const updateShippingRate = async (req, res) => {
    // Fetch shipping rate by ID
    const shippingRate = await ShippingRate.findById(req.params.id);
    if (!shippingRate) {
        return res.status(404).json({ message: 'Shipping rate not found' });
    }

    // Update shipping rate fields
    shippingRate.governorate = req.body.governorate;
    shippingRate.cost = req.body.cost;
    shippingRate.time = req.body.time;

    try {
        const updatedRate = await shippingRate.save();
        res.status(200).json(updatedRate);
    } catch (error) {
        res.status(500).json({ message: 'Error updating shipping rate', error });
    }
};