const express = require("express");
const VendorRouter = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const verifyAsync = promisify(jwt.verify);
const secretKey = 'safarnama';

VendorRouter.get('/airline-details', async (req, res) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authToken.split(' ')[1];
        const decodedToken = await verifyAsync(token, secretKey);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decodedToken.userId;

        // Fetch vendor_id from vendors table using user_id
        const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
        pool.query(vendorIdQuery, [userId], async (error, vendorIdResults) => {
            if (error) {
                console.error('Error fetching vendor ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;
            console.log(vendorId)
            // Fetch transport_id from transport table using vendor_id
            const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
            pool.query(transportIdQuery, [vendorId], async (error, transportIdResults) => {
                if (error) {
                    console.error('Error fetching transport ID:', error);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;
                console.log(transportId)
                // Fetch airline_id from airline_transport table using transport_id
                const airlineIdQuery = 'SELECT airline_id FROM airline_transport WHERE transport_id = ?';
                pool.query(airlineIdQuery, [transportId], async (error, airlineIdResults) => {
                    if (error) {
                        console.error('Error fetching airline ID:', error);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'Airline not found' });
                    }

                    const airlineId = airlineIdResults[0].airline_id;
                    console.log(airlineId)
                    // Fetch airline details from airline_details table using airline_id
                    const airlineDetailsQuery = `
              SELECT * FROM airline_details WHERE airline_id = ?
            `;
                    pool.query(airlineDetailsQuery, [airlineId], (err, airlineDetailsResults) => {
                        if (err) {
                            console.error('Error fetching airline details:', err);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsResults.length === 0) {
                            return res.status(404).json({ error: 'Airline details not found' });
                        }
                        airlineDetailsResults.forEach(airplane => {
                            airplane.logo = Buffer.from(airplane.logo).toString('base64');
                        });
                        console.log(airlineDetailsResults[0]);
                        const airlineDetails = airlineDetailsResults[0];
                        res.status(200).json(airlineDetails);
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

VendorRouter.post("/airline_packages", async (req, res) => {
    try {
        // Extract token from request headers
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authToken.split(' ')[1];

        // Decode token to get userId
        const decodedToken = await verifyAsync(token, secretKey);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        // Fetch vendor_id from vendors table using user_id
        pool.query('SELECT vendor_id FROM vendors WHERE user_id = ?', [userId], (vendorIdError, vendorIdResults) => {
            if (vendorIdError) {
                console.error('Error fetching vendor ID:', vendorIdError);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;

            // Fetch transport_id from transports table using vendor_id
            pool.query('SELECT transport_id FROM transport WHERE vendor_id = ?', [vendorId], (transportIdError, transportIdResults) => {
                if (transportIdError) {
                    console.error('Error fetching transport ID:', transportIdError);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;

                // Fetch airline_id from airline_transport table using transport_id
                pool.query('SELECT airline_id FROM airline_transport WHERE transport_id = ?', [transportId], (airlineIdError, airlineIdResults) => {
                    if (airlineIdError) {
                        console.error('Error fetching airline ID:', airlineIdError);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'Airline not found' });
                    }

                    const airlineId = airlineIdResults[0].airline_id;

                    // Fetch airline_details_id from airline_details table using airline_id
                    pool.query('SELECT airline_details_id FROM airline_details WHERE airline_id = ?', [airlineId], (airlineDetailsIdError, airlineDetailsIdResults) => {
                        if (airlineDetailsIdError) {
                            console.error('Error fetching airline details ID:', airlineDetailsIdError);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsIdResults.length === 0) {
                            return res.status(404).json({ error: 'Airline details not found' });
                        }

                        const airlineDetailsId = airlineDetailsIdResults[0].airline_details_id;

                        // Extract data from request body
                        const { departureCity, arrivalCity, flightType, flightNumber, price, departureDate, departureTime, arrivalDate, arrivalTime, calculatedDuration } = req.body;

                        // Insert data into airline_packages table
                        const insertQuery = `
                INSERT INTO airline_packages (airline_details_id, departure_city, arrival_city, seat_type, flight_number, ticket_price, departure_date, departure_time, arrival_date, arrival_time, flight_duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
                        const insertValues = [
                            airlineDetailsId,
                            departureCity,
                            arrivalCity,
                            flightType,
                            flightNumber,
                            price,
                            departureDate,
                            departureTime,
                            arrivalDate,
                            arrivalTime,
                            calculatedDuration
                        ];
                        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
                            if (insertError) {
                                console.error('Error inserting data:', insertError);
                                return res.status(500).json({ error: 'Error inserting data' });
                            }
                            // Return success response
                            res.status(200).json({ message: "Ticket added successfully" });
                            console.log(insertValues)
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error adding ticket:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.get('/get_airline_packages', async (req, res) => {
    try {
        // Extract token from request headers
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authToken.split(' ')[1];

        // Decode token to get userId
        const decodedToken = await verifyAsync(token, secretKey);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        // Step 1: Fetch vendor_id from vendors table using user_id
        const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
        pool.query(vendorIdQuery, [userId], (error, vendorIdResults) => {
            if (error) {
                console.error('Error fetching vendor ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;

            // Step 2: Fetch transport_id from transport table using vendor_id
            const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
            pool.query(transportIdQuery, [vendorId], (error, transportIdResults) => {
                if (error) {
                    console.error('Error fetching transport ID:', error);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;

                // Step 3: Fetch airline_id from airline_transport table using transport_id
                const airlineIdQuery = 'SELECT airline_id FROM airline_transport WHERE transport_id = ?';
                pool.query(airlineIdQuery, [transportId], (error, airlineIdResults) => {
                    if (error) {
                        console.error('Error fetching airline ID:', error);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'Airline not found' });
                    }

                    const airlineId = airlineIdResults[0].airline_id;

                    // Step 4: Fetch airline_details_id from airline_details table using airline_id
                    const airlineDetailsIdQuery = 'SELECT airline_details_id FROM airline_details WHERE airline_id = ?';
                    pool.query(airlineDetailsIdQuery, [airlineId], (error, airlineDetailsIdResults) => {
                        if (error) {
                            console.error('Error fetching airline details ID:', error);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsIdResults.length === 0) {
                            return res.status(404).json({ error: 'Airline details not found' });
                        }

                        const airlineDetailsId = airlineDetailsIdResults[0].airline_details_id;

                        // Step 5: Fetch airline packages from airline_packages join airline_details using airline_details_id
                        const airlinePackagesQuery = `
                SELECT airline_packages.*, airline_details.*
                FROM airline_packages
                INNER JOIN airline_details
                ON airline_packages.airline_details_id = airline_details.airline_details_id
                WHERE airline_packages.airline_details_id = ?
              `;
                        pool.query(airlinePackagesQuery, [airlineDetailsId], (error, airlinePackagesResults) => {
                            if (error) {
                                console.error('Error fetching airline packages:', error);
                                return res.status(500).json({ error: 'Error fetching data' });
                            }

                            airlinePackagesResults.forEach(airplane => {
                                airplane.logo = Buffer.from(airplane.logo).toString('base64');
                            });
                            res.status(200).json(airlinePackagesResults);
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error fetching airline packages:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});

VendorRouter.put('/update_airline_package/:airline_operation_id', async (req, res) => {
    try {
        // Extract airline operation ID from request parameters
        const { airline_operation_id } = req.params;

        // Extract updated data from request body
        const updatedData = req.body;

        // Fields to update
        const fieldsToUpdate = {
            airline_operations_id: updatedData.airline_operations_id,
            airline_details_id: updatedData.airline_details_id,
            departure_city: updatedData.departureCity,
            arrival_city: updatedData.arrivalCity,
            seat_type: updatedData.flightType,
            flight_number: updatedData.flightNumber,
            ticket_price: updatedData.price,
            departure_date: updatedData.departureDate,
            departure_time: updatedData.departureTime,
            arrival_date: updatedData.arrivalDate,
            arrival_time: updatedData.arrivalTime,
            flight_duration: updatedData.calculatedDuration,
        };
        console.log(fieldsToUpdate);

        // Step 1: Update airline package directly using airline_operation_id
        const updateQuery = `
        UPDATE airline_packages
        SET ?
        WHERE airline_operations_id = ?
      `;
        console.log(updateQuery);
        pool.query(updateQuery, [fieldsToUpdate, airline_operation_id], (error, updateResults) => {
            if (error) {
                console.error('Error updating airline package:', error);
                return res.status(500).json({ error: 'Error updating data' });
            }

            if (updateResults.affectedRows === 0) {
                return res.status(404).json({ error: 'Airline package not found' });
            }

            // Step 2: Select and return all data using airline_operation_id
            const selectQuery = `
          SELECT *
          FROM airline_packages
          WHERE airline_operations_id = ?
        `;
            pool.query(selectQuery, [airline_operation_id], (error, selectResults) => {
                if (error) {
                    console.error('Error selecting airline package:', error);
                    return res.status(500).json({ error: 'Error selecting data' });
                }

                if (selectResults.length === 0) {
                    return res.status(404).json({ error: 'Updated airline package not found' });
                }

                const updatedPackage = selectResults[0];
                console.log(updatedPackage);
                res.status(200).json({ message: 'Airline package updated successfully', updatedPackage });
            });
        });
    } catch (error) {
        console.error("Error updating airline package:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.delete('/delete_airline_package/:airline_operation_id', async (req, res) => {
    try {
        const { airline_operation_id } = req.params;

        // Step 1: Delete related records from package_details using airline_operation_id
        const deletePackageDetailsQuery = `
            DELETE FROM package_details
            WHERE airline_operations_id = ?
        `;
        pool.query(deletePackageDetailsQuery, [airline_operation_id], (error, deletePackageDetailsResults) => {
            if (error) {
                console.error('Error deleting package details:', error);
                return res.status(500).json({ error: 'Error deleting package details' });
            }

            // Step 2: Delete airline package using airline_operation_id
            const deleteAirlinePackageQuery = `
                DELETE FROM airline_packages
                WHERE airline_operations_id = ?
            `;
            pool.query(deleteAirlinePackageQuery, [airline_operation_id], (error, deleteResults) => {
                if (error) {
                    console.error('Error deleting airline package:', error);
                    return res.status(500).json({ error: 'Error deleting data' });
                }

                if (deleteResults.affectedRows === 0) {
                    return res.status(404).json({ error: 'Airline package not found' });
                }

                res.status(200).json({ message: 'Airline package and related details deleted successfully' });
            });
        });
    } catch (error) {
        console.error("Error deleting airline package:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

VendorRouter.get('/bus-details', async (req, res) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authToken.split(' ')[1];
        const decodedToken = await verifyAsync(token, secretKey);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decodedToken.userId;

        // Fetch vendor_id from vendors table using user_id
        const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
        pool.query(vendorIdQuery, [userId], async (error, vendorIdResults) => {
            if (error) {
                console.error('Error fetching vendor ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;
            console.log(vendorId)
            // Fetch transport_id from transport table using vendor_id
            const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
            pool.query(transportIdQuery, [vendorId], async (error, transportIdResults) => {
                if (error) {
                    console.error('Error fetching transport ID:', error);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;
                console.log(transportId)
                // Fetch airline_id from airline_transport table using transport_id
                const airlineIdQuery = 'SELECT bus_id FROM bus_transport WHERE transport_id = ?';
                pool.query(airlineIdQuery, [transportId], async (error, airlineIdResults) => {
                    if (error) {
                        console.error('Error fetching airline ID:', error);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'Bus not found' });
                    }

                    const airlineId = airlineIdResults[0].bus_id;
                    console.log(airlineId)
                    // Fetch airline details from airline_details table using airline_id
                    const airlineDetailsQuery = `
              SELECT * FROM bus_details WHERE bus_id = ?
            `;
                    pool.query(airlineDetailsQuery, [airlineId], (err, airlineDetailsResults) => {
                        if (err) {
                            console.error('Error fetching airline details:', err);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsResults.length === 0) {
                            return res.status(404).json({ error: 'Airline details not found' });
                        }
                        airlineDetailsResults.forEach(bus => {
                            bus.logo = Buffer.from(bus.logo).toString('base64');
                        });
                        console.log(airlineDetailsResults[0]);
                        const airlineDetails = airlineDetailsResults[0];
                        res.status(200).json(airlineDetails);
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

VendorRouter.post("/bus_packages", async (req, res) => {
    try {
        // Extract token from request headers
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authToken.split(' ')[1];

        // Decode token to get userId
        const decodedToken = await verifyAsync(token, secretKey);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        // Fetch vendor_id from vendors table using user_id
        pool.query('SELECT vendor_id FROM vendors WHERE user_id = ?', [userId], (vendorIdError, vendorIdResults) => {
            if (vendorIdError) {
                console.error('Error fetching vendor ID:', vendorIdError);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;

            // Fetch transport_id from transports table using vendor_id
            pool.query('SELECT transport_id FROM transport WHERE vendor_id = ?', [vendorId], (transportIdError, transportIdResults) => {
                if (transportIdError) {
                    console.error('Error fetching transport ID:', transportIdError);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;

                // Fetch airline_id from airline_transport table using transport_id
                pool.query('SELECT bus_id FROM bus_transport WHERE transport_id = ?', [transportId], (airlineIdError, airlineIdResults) => {
                    if (airlineIdError) {
                        console.error('Error fetching airline ID:', airlineIdError);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'Airline not found' });
                    }

                    const airlineId = airlineIdResults[0].bus_id;

                    // Fetch airline_details_id from airline_details table using airline_id
                    pool.query('SELECT bus_details_id FROM bus_details WHERE bus_id = ?', [airlineId], (airlineDetailsIdError, airlineDetailsIdResults) => {
                        if (airlineDetailsIdError) {
                            console.error('Error fetching airline details ID:', airlineDetailsIdError);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsIdResults.length === 0) {
                            return res.status(404).json({ error: 'Bus details not found' });
                        }

                        const airlineDetailsId = airlineDetailsIdResults[0].bus_details_id;

                        // Extract data from request body
                        const { departureCity, arrivalCity, flightType, BusNumber, price, departureDate, departureTime, arrivalDate, arrivalTime, calculatedDuration } = req.body;

                        // Insert data into airline_packages table
                        const insertQuery = `
                INSERT INTO bus_packages (bus_details_id, departure_city, arrival_city, seat_type, bus_number, ticket_price, departure_date, departure_time, arrival_date, arrival_time, journey_duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
                        const insertValues = [
                            airlineDetailsId,
                            departureCity,
                            arrivalCity,
                            flightType,
                            BusNumber,
                            price,
                            departureDate,
                            departureTime,
                            arrivalDate,
                            arrivalTime,
                            calculatedDuration
                        ];
                        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
                            if (insertError) {
                                console.error('Error inserting data:', insertError);
                                return res.status(500).json({ error: 'Error inserting data' });
                            }
                            console.log(insertResults);
                            // Return success response
                            res.status(200).json({ message: "Ticket added successfully" });
                            console.log(insertValues)
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error adding ticket:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.get('/get_bus_packages', async (req, res) => {
    try {
        // Extract token from request headers
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authToken.split(' ')[1];

        // Decode token to get userId
        const decodedToken = await verifyAsync(token, secretKey);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        // Step 1: Fetch vendor_id from vendors table using user_id
        const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
        pool.query(vendorIdQuery, [userId], (error, vendorIdResults) => {
            if (error) {
                console.error('Error fetching vendor ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;

            // Step 2: Fetch transport_id from transport table using vendor_id
            const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
            pool.query(transportIdQuery, [vendorId], (error, transportIdResults) => {
                if (error) {
                    console.error('Error fetching transport ID:', error);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;

                // Step 3: Fetch airline_id from airline_transport table using transport_id
                const airlineIdQuery = 'SELECT bus_id FROM bus_transport WHERE transport_id = ?';
                pool.query(airlineIdQuery, [transportId], (error, airlineIdResults) => {
                    if (error) {
                        console.error('Error fetching airline ID:', error);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'bus not found' });
                    }

                    const airlineId = airlineIdResults[0].bus_id;

                    // Step 4: Fetch airline_details_id from airline_details table using airline_id
                    const airlineDetailsIdQuery = 'SELECT bus_details_id FROM bus_details WHERE bus_id = ?';
                    pool.query(airlineDetailsIdQuery, [airlineId], (error, airlineDetailsIdResults) => {
                        if (error) {
                            console.error('Error fetching airline details ID:', error);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsIdResults.length === 0) {
                            return res.status(404).json({ error: 'Airline details not found' });
                        }

                        const airlineDetailsId = airlineDetailsIdResults[0].bus_details_id;

                        // Step 5: Fetch airline packages from airline_packages join airline_details using airline_details_id
                        const airlinePackagesQuery = `
                SELECT bus_packages.*, bus_details.*
                FROM bus_packages
                INNER JOIN bus_details
                ON bus_packages.bus_details_id = bus_details.bus_details_id
                WHERE bus_packages.bus_details_id = ?
              `;
                        pool.query(airlinePackagesQuery, [airlineDetailsId], (error, airlinePackagesResults) => {
                            if (error) {
                                console.error('Error fetching airline packages:', error);
                                return res.status(500).json({ error: 'Error fetching data' });
                            }

                            airlinePackagesResults.forEach(bus => {
                                bus.logo = Buffer.from(bus.logo).toString('base64');
                            });
                            res.status(200).json(airlinePackagesResults);
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error fetching airline packages:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});

VendorRouter.put('/update_bus_package/:bus_package_id', async (req, res) => {
    try {
        // Extract airline operation ID from request parameters
        const { bus_package_id } = req.params;

        // Extract updated data from request body
        const updatedData = req.body;

        // Fields to update
        const fieldsToUpdate = {
            bus_package_id: updatedData.bus_package_id,
            bus_details_id: updatedData.bus_details_id,
            departure_city: updatedData.departureCity,
            arrival_city: updatedData.arrivalCity,
            seat_type: updatedData.flightType,
            bus_number: updatedData.BusNumber,
            ticket_price: updatedData.price,
            departure_date: updatedData.departureDate,
            departure_time: updatedData.departureTime,
            arrival_date: updatedData.arrivalDate,
            arrival_time: updatedData.arrivalTime,
            journey_duration: updatedData.calculatedDuration,
        };
        console.log(fieldsToUpdate);

        // Step 1: Update airline package directly using airline_operation_id
        const updateQuery = `
        UPDATE bus_packages
        SET ?
        WHERE bus_package_id = ?
      `;
        console.log(updateQuery);
        pool.query(updateQuery, [fieldsToUpdate, bus_package_id], (error, updateResults) => {
            if (error) {
                console.error('Error updating airline package:', error);
                return res.status(500).json({ error: 'Error updating data' });
            }

            if (updateResults.affectedRows === 0) {
                return res.status(404).json({ error: 'Airline package not found' });
            }

            // Step 2: Select and return all data using airline_operation_id
            const selectQuery = `
          SELECT *
          FROM bus_packages
          WHERE bus_package_id = ?
        `;
            pool.query(selectQuery, [bus_package_id], (error, selectResults) => {
                if (error) {
                    console.error('Error selecting bus package:', error);
                    return res.status(500).json({ error: 'Error selecting data' });
                }

                if (selectResults.length === 0) {
                    return res.status(404).json({ error: 'Updated bus package not found' });
                }

                const updatedPackage = selectResults[0];
                console.log(updatedPackage);
                res.status(200).json({ message: 'Bus package updated successfully', updatedPackage });
            });
        });
    } catch (error) {
        console.error("Error updating bus package:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.delete('/delete_bus_package/:bus_package_id', async (req, res) => {
    try {
        const { bus_package_id } = req.params;

        // Step 1: Delete related records from package_details using airline_operation_id
        const deletePackageDetailsQuery = `
            DELETE FROM package_details
            WHERE bus_package_id = ?
        `;
        pool.query(deletePackageDetailsQuery, [bus_package_id], (error, deletePackageDetailsResults) => {
            if (error) {
                console.error('Error deleting package details:', error);
                return res.status(500).json({ error: 'Error deleting package details' });
            }

            // Step 2: Delete airline package using airline_operation_id
            const deleteAirlinePackageQuery = `
                DELETE FROM bus_packages
                WHERE bus_package_id = ?
            `;
            pool.query(deleteAirlinePackageQuery, [bus_package_id], (error, deleteResults) => {
                if (error) {
                    console.error('Error deleting Bus package:', error);
                    return res.status(500).json({ error: 'Error deleting data' });
                }

                if (deleteResults.affectedRows === 0) {
                    return res.status(404).json({ error: 'Airline package not found' });
                }

                res.status(200).json({ message: 'Bus package and related details deleted successfully' });
            });
        });
    } catch (error) {
        console.error("Error deleting Bus package:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.get('/railway-details', async (req, res) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authToken.split(' ')[1];
        const decodedToken = await verifyAsync(token, secretKey);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decodedToken.userId;

        // Fetch vendor_id from vendors table using user_id
        const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
        pool.query(vendorIdQuery, [userId], async (error, vendorIdResults) => {
            if (error) {
                console.error('Error fetching vendor ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;
            console.log(vendorId)
            // Fetch transport_id from transport table using vendor_id
            const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
            pool.query(transportIdQuery, [vendorId], async (error, transportIdResults) => {
                if (error) {
                    console.error('Error fetching transport ID:', error);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;
                console.log(transportId)
                // Fetch airline_id from airline_transport table using transport_id
                const airlineIdQuery = 'SELECT railway_id FROM railway_transport WHERE transport_id = ?';
                pool.query(airlineIdQuery, [transportId], async (error, airlineIdResults) => {
                    if (error) {
                        console.error('Error fetching railway ID:', error);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'railway not found' });
                    }

                    const airlineId = airlineIdResults[0].railway_id;
                    console.log(airlineId)
                    // Fetch airline details from airline_details table using airline_id
                    const airlineDetailsQuery = `
              SELECT * FROM railway_details WHERE railway_id = ?
            `;
                    pool.query(airlineDetailsQuery, [airlineId], (err, airlineDetailsResults) => {
                        if (err) {
                            console.error('Error fetching railway details:', err);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsResults.length === 0) {
                            return res.status(404).json({ error: 'railway details not found' });
                        }
                        airlineDetailsResults.forEach(airplane => {
                            airplane.logo = Buffer.from(airplane.logo).toString('base64');
                        });
                        console.log(airlineDetailsResults[0]);
                        const airlineDetails = airlineDetailsResults[0];
                        res.status(200).json(airlineDetails);
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

VendorRouter.post("/railway_packages", async (req, res) => {
    try {
        // Extract token from request headers
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authToken.split(' ')[1];

        // Decode token to get userId
        const decodedToken = await verifyAsync(token, secretKey);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        // Fetch vendor_id from vendors table using user_id
        pool.query('SELECT vendor_id FROM vendors WHERE user_id = ?', [userId], (vendorIdError, vendorIdResults) => {
            if (vendorIdError) {
                console.error('Error fetching vendor ID:', vendorIdError);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;

            // Fetch transport_id from transports table using vendor_id
            pool.query('SELECT transport_id FROM transport WHERE vendor_id = ?', [vendorId], (transportIdError, transportIdResults) => {
                if (transportIdError) {
                    console.error('Error fetching transport ID:', transportIdError);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;

                // Fetch airline_id from airline_transport table using transport_id
                pool.query('SELECT railway_id FROM railway_transport WHERE transport_id = ?', [transportId], (airlineIdError, airlineIdResults) => {
                    if (airlineIdError) {
                        console.error('Error fetching railway ID:', airlineIdError);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'railway not found' });
                    }

                    const airlineId = airlineIdResults[0].railway_id;

                    // Fetch airline_details_id from airline_details table using airline_id
                    pool.query('SELECT railway_details_id FROM railway_details WHERE railway_id = ?', [airlineId], (airlineDetailsIdError, airlineDetailsIdResults) => {
                        if (airlineDetailsIdError) {
                            console.error('Error fetching railway details ID:', airlineDetailsIdError);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsIdResults.length === 0) {
                            return res.status(404).json({ error: 'railway details not found' });
                        }

                        const airlineDetailsId = airlineDetailsIdResults[0].railway_details_id;

                        // Extract data from request body
                        const { departureCity, arrivalCity, flightType, BusNumber, price, departureDate, departureTime, arrivalDate, arrivalTime, calculatedDuration } = req.body;

                        // Insert data into airline_packages table
                        const insertQuery = `
                INSERT INTO railway_packages (railway_details_id, departure_city, arrival_city, seat_type, train_number, ticket_price, departure_date, departure_time, arrival_date, arrival_time, journey_duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
                        const insertValues = [
                            airlineDetailsId,
                            departureCity,
                            arrivalCity,
                            flightType,
                            BusNumber,
                            price,
                            departureDate,
                            departureTime,
                            arrivalDate,
                            arrivalTime,
                            calculatedDuration
                        ];
                        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
                            if (insertError) {
                                console.error('Error inserting data:', insertError);
                                return res.status(500).json({ error: 'Error inserting data' });
                            }
                            // Return success response
                            res.status(200).json({ message: "Ticket added successfully" });
                            console.log(insertValues)
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error adding ticket:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.get('/get_railway_packages', async (req, res) => {
    try {
        // Extract token from request headers
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authToken.split(' ')[1];

        // Decode token to get userId
        const decodedToken = await verifyAsync(token, secretKey);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        // Step 1: Fetch vendor_id from vendors table using user_id
        const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
        pool.query(vendorIdQuery, [userId], (error, vendorIdResults) => {
            if (error) {
                console.error('Error fetching vendor ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (vendorIdResults.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendorId = vendorIdResults[0].vendor_id;

            // Step 2: Fetch transport_id from transport table using vendor_id
            const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
            pool.query(transportIdQuery, [vendorId], (error, transportIdResults) => {
                if (error) {
                    console.error('Error fetching transport ID:', error);
                    return res.status(500).json({ error: 'Error fetching data' });
                }

                if (transportIdResults.length === 0) {
                    return res.status(404).json({ error: 'Transport not found' });
                }

                const transportId = transportIdResults[0].transport_id;

                // Step 3: Fetch airline_id from airline_transport table using transport_id
                const airlineIdQuery = 'SELECT railway_id FROM railway_transport WHERE transport_id = ?';
                pool.query(airlineIdQuery, [transportId], (error, airlineIdResults) => {
                    if (error) {
                        console.error('Error fetching railway ID:', error);
                        return res.status(500).json({ error: 'Error fetching data' });
                    }

                    if (airlineIdResults.length === 0) {
                        return res.status(404).json({ error: 'railway not found' });
                    }

                    const airlineId = airlineIdResults[0].railway_id;

                    // Step 4: Fetch airline_details_id from airline_details table using airline_id
                    const airlineDetailsIdQuery = 'SELECT railway_details_id FROM railway_details WHERE railway_id = ?';
                    pool.query(airlineDetailsIdQuery, [airlineId], (error, airlineDetailsIdResults) => {
                        if (error) {
                            console.error('Error fetching railway details ID:', error);
                            return res.status(500).json({ error: 'Error fetching data' });
                        }

                        if (airlineDetailsIdResults.length === 0) {
                            return res.status(404).json({ error: 'railway details not found' });
                        }

                        const airlineDetailsId = airlineDetailsIdResults[0].railway_details_id;

                        // Step 5: Fetch airline packages from airline_packages join airline_details using airline_details_id
                        const airlinePackagesQuery = `
                SELECT railway_packages.*, railway_details.*
                FROM railway_packages
                INNER JOIN railway_details
                ON railway_packages.railway_details_id = railway_details.railway_details_id
                WHERE railway_packages.railway_details_id = ?
              `;
                        pool.query(airlinePackagesQuery, [airlineDetailsId], (error, airlinePackagesResults) => {
                            if (error) {
                                console.error('Error fetching railway packages:', error);
                                return res.status(500).json({ error: 'Error fetching data' });
                            }

                            airlinePackagesResults.forEach(airplane => {
                                airplane.logo = Buffer.from(airplane.logo).toString('base64');
                            });
                            res.status(200).json(airlinePackagesResults);
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error fetching railway packages:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});

VendorRouter.put('/update_railway_package/:railway_package_id', async (req, res) => {
    try {
        // Extract airline operation ID from request parameters
        const { railway_package_id } = req.params;

        // Extract updated data from request body
        const updatedData = req.body;

        // Fields to update
        const fieldsToUpdate = {
            railway_package_id: updatedData.railway_package_id,
            railway_details_id: updatedData.railway_details_id,
            departure_city: updatedData.departureCity,
            arrival_city: updatedData.arrivalCity,
            seat_type: updatedData.flightType,
            train_number: updatedData.flightNumber,
            ticket_price: updatedData.price,
            departure_date: updatedData.departureDate,
            departure_time: updatedData.departureTime,
            arrival_date: updatedData.arrivalDate,
            arrival_time: updatedData.arrivalTime,
            journey_duration: updatedData.calculatedDuration,
        };
        console.log(fieldsToUpdate);

        // Step 1: Update airline package directly using airline_operation_id
        const updateQuery = `
        UPDATE railway_packages
        SET ?
        WHERE railway_package_id = ?
      `;
        console.log(updateQuery);
        pool.query(updateQuery, [fieldsToUpdate, railway_package_id], (error, updateResults) => {
            if (error) {
                console.error('Error updating railway package:', error);
                return res.status(500).json({ error: 'Error updating data' });
            }

            if (updateResults.affectedRows === 0) {
                return res.status(404).json({ error: 'railway package not found' });
            }

            // Step 2: Select and return all data using airline_operation_id
            const selectQuery = `
          SELECT *
          FROM railway_packages
          WHERE railway_package_id = ?
        `;
            pool.query(selectQuery, [railway_package_id], (error, selectResults) => {
                if (error) {
                    console.error('Error selecting railway package:', error);
                    return res.status(500).json({ error: 'Error selecting data' });
                }

                if (selectResults.length === 0) {
                    return res.status(404).json({ error: 'Updated railway package not found' });
                }

                const updatedPackage = selectResults[0];
                console.log(updatedPackage);
                res.status(200).json({ message: 'railway package updated successfully', updatedPackage });
            });
        });
    } catch (error) {
        console.error("Error updating railway package:", error);
        // Return error response
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.delete('/delete_railway_package/:railway_package_id', async (req, res) => {
    try {
        const { railway_package_id } = req.params;

        // Step 1: Delete related records from package_details using airline_operation_id
        const deletePackageDetailsQuery = `
            DELETE FROM package_details
            WHERE railway_package_id = ?
        `;
        pool.query(deletePackageDetailsQuery, [railway_package_id], (error, deletePackageDetailsResults) => {
            if (error) {
                console.error('Error deleting package details:', error);
                return res.status(500).json({ error: 'Error deleting package details' });
            }

            // Step 2: Delete airline package using airline_operation_id
            const deleteAirlinePackageQuery = `
                DELETE FROM railway_packages
                WHERE railway_package_id = ?
            `;
            pool.query(deleteAirlinePackageQuery, [railway_package_id], (error, deleteResults) => {
                if (error) {
                    console.error('Error deleting railway package:', error);
                    return res.status(500).json({ error: 'Error deleting data' });
                }

                if (deleteResults.affectedRows === 0) {
                    return res.status(404).json({ error: 'railway package not found' });
                }

                res.status(200).json({ message: 'railway package and related details deleted successfully' });
            });
        });
    } catch (error) {
        console.error("Error deleting railway package:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


VendorRouter.post('/hotel_packages', (req, res) => {
    const authToken = req.headers.authorization;
    if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authToken.split(' ')[1];

    // Verify and decode the token
    jwt.verify(token, secretKey, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = decodedToken.userId;

        const getVendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';

        db.query(getVendorIdQuery, userId, (err, vendorResult) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                const vendorId = vendorResult[0].vendor_id;

                // Fetch hotel_id from hotels table using vendor_id
                const getHotelIdQuery = 'SELECT hotel_id FROM hotels WHERE vendor_id = ?';

                db.query(getHotelIdQuery, vendorId, (err, hotelResult) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        const hotelId = hotelResult[0].hotel_id;

                        const hotelDetails = req.body;
                        hotelDetails.hotel_id = hotelId; // Add hotel_id to the hotel details object

                        // Insert hotel details into the database
                        const sql = `INSERT INTO hotel_details 
                          (hotel_id, name, area, city, description, facilities, 
                          rooms_single_bed, rooms_double_bed, rooms_standard, rooms_executive, 
                          price_single_bed, price_double_bed, price_standard, price_executive, 
                          adults_single_bed, children_single_bed, adults_double_bed, children_double_bed, 
                          adults_standard, children_standard, adults_executive, children_executive, 
                          email, contact_number, images, rating, reviews, gallery) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                        const values = [
                            hotelDetails.hotel_id,
                            hotelDetails.name,
                            hotelDetails.area,
                            hotelDetails.city,
                            hotelDetails.description,
                            hotelDetails.facilities,
                            hotelDetails.rooms_single_bed,
                            hotelDetails.rooms_double_bed,
                            hotelDetails.rooms_standard,
                            hotelDetails.rooms_executive,
                            hotelDetails.price_single_bed,
                            hotelDetails.price_double_bed,
                            hotelDetails.price_standard,
                            hotelDetails.price_executive,
                            hotelDetails.adults_single_bed,
                            hotelDetails.children_single_bed,
                            hotelDetails.adults_double_bed,
                            hotelDetails.children_double_bed,
                            hotelDetails.adults_standard,
                            hotelDetails.children_standard,
                            hotelDetails.adults_executive,
                            hotelDetails.children_executive,
                            hotelDetails.email,
                            hotelDetails.contact_number,
                            hotelDetails.images,
                            hotelDetails.rating,
                            hotelDetails.reviews,
                            hotelDetails.gallery,
                        ];

                        db.query(sql, values, (err, result) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                            } else {
                                res.status(200).json({ message: 'Hotel details inserted successfully' });
                            }
                        });
                    }
                });
            }
        });
    });
});

module.exports = VendorRouter;
